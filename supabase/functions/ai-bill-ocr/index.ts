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
    const { imageBase64, imageUrl } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!imageBase64 && !imageUrl) {
      throw new Error("Either imageBase64 or imageUrl is required");
    }

    console.log("[ai-bill-ocr] Processing bill image...");

    const imageContent = imageBase64 
      ? `data:image/jpeg;base64,${imageBase64}`
      : imageUrl;

    const systemPrompt = `You are an expert at reading and extracting data from wholesaler/vendor bills and invoices.

Extract ALL items from this bill image with the following information:
- Item name/description
- Quantity
- Unit (pcs, kg, box, dozen, etc.)
- Rate/Price per unit
- Total amount for that item
- Size/variant if visible
- Color if visible

Also extract:
- Vendor/Supplier name
- Bill/Invoice number
- Bill date
- Total amount
- GST details if visible

RESPOND WITH VALID JSON ONLY in this exact format:
{
  "vendor": {
    "name": "vendor name",
    "phone": "phone if visible",
    "address": "address if visible",
    "gstin": "GSTIN if visible"
  },
  "bill": {
    "invoiceNumber": "bill number",
    "date": "YYYY-MM-DD format",
    "totalAmount": 0,
    "gstAmount": 0
  },
  "items": [
    {
      "name": "item name",
      "quantity": 1,
      "unit": "pcs",
      "rate": 100,
      "size": "size if visible or null",
      "color": "color if visible or null",
      "total": 100,
      "gstRate": 0
    }
  ],
  "confidence": 0.9,
  "notes": "any issues or unclear items"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro", // Using pro for better OCR accuracy
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: [
              { 
                type: "text", 
                text: "Extract all items and details from this wholesaler bill:" 
              },
              {
                type: "image_url",
                image_url: { url: imageContent }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ai-bill-ocr] AI gateway error:", response.status, errorText);
      
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
    
    console.log("[ai-bill-ocr] AI response:", content);

    // Parse the JSON response from AI
    let parsedResult;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      parsedResult = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("[ai-bill-ocr] Failed to parse AI response:", parseError);
      return new Response(JSON.stringify({ 
        error: "Failed to parse bill. Please try with a clearer image.",
        success: false 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      ...parsedResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("[ai-bill-ocr] Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
