import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, inventory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("[ai-voice-billing] Processing text:", text);
    console.log("[ai-voice-billing] Inventory items count:", inventory?.length || 0);

    // Build inventory context for AI
    const inventoryContext = inventory?.map((item: any) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      price: item.basePrice,
      variants: item.variants?.map((v: any) => `${v.size} ${v.color}`).join(', ') || 'no variants',
      stock: item.totalStock
    })) || [];

    const systemPrompt = `You are an AI assistant for a retail billing system. Parse voice/text input to extract billing information.

AVAILABLE INVENTORY:
${JSON.stringify(inventoryContext, null, 2)}

RULES:
1. Match item names loosely (e.g., "red shirt large" should match an item with name containing "shirt" and variant with size "large" and color "red")
2. Extract quantities (default to 1 if not mentioned)
3. Extract customer name if mentioned
4. Be flexible with Indian English pronunciations and Hindi words
5. If an item is not in inventory, still include it with itemId: null

RESPOND WITH VALID JSON ONLY in this exact format:
{
  "items": [
    {
      "itemId": "item_id or null if not found",
      "name": "matched item name",
      "quantity": 1,
      "size": "size if mentioned",
      "color": "color if mentioned"
    }
  ],
  "customerName": "customer name if mentioned or null",
  "confidence": 0.85
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Parse this billing input: "${text}"` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ai-voice-billing] AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("[ai-voice-billing] AI response:", content);

    // Parse the JSON response from AI
    let parsedResult;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      parsedResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("[ai-voice-billing] Failed to parse AI response:", parseError);
      parsedResult = { items: [], customerName: null, confidence: 0 };
    }

    return new Response(JSON.stringify({
      success: true,
      ...parsedResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("[ai-voice-billing] Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
