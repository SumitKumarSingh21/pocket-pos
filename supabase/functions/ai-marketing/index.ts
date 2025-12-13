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
    const { shopName, occasion, discount, products, customerName, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("[ai-marketing] Generating message for:", { shopName, occasion, discount });

    const systemPrompt = `You are a marketing expert for Indian retail businesses. Generate compelling WhatsApp marketing messages.

RULES:
1. Keep messages under 500 characters for WhatsApp
2. Use emojis appropriately (2-4 per message)
3. Include a clear call-to-action
4. If language is Hindi, write in Hinglish (Hindi words in English script)
5. Make it personal if customer name is provided
6. Include the discount/offer prominently
7. Mention the shop name naturally

Generate a single marketing message ready to send on WhatsApp.`;

    const userPrompt = `Generate a marketing message with these details:
- Shop Name: ${shopName || 'Our Shop'}
- Occasion/Event: ${occasion || 'General Promotion'}
- Discount/Offer: ${discount ? `${discount}% OFF` : 'Special prices'}
- Featured Products: ${products?.join(', ') || 'All items'}
- Customer Name: ${customerName || 'Valued Customer'}
- Language: ${language || 'English with some Hindi'}

Just respond with the message text only, no explanation.`;

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
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ai-marketing] AI gateway error:", response.status, errorText);
      
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
    const message = data.choices?.[0]?.message?.content?.trim();
    
    console.log("[ai-marketing] Generated message:", message);

    return new Response(JSON.stringify({
      success: true,
      message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("[ai-marketing] Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
