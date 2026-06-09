import { NextRequest, NextResponse } from "next/server";

interface NpraProduct {
  index: string;
  regNo: string;
  name: string;
  holder: string;
}

function parseHtml(html: string): NpraProduct[] {
  const products: NpraProduct[] = [];
  
  // Extract tbody
  const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) return [];
  
  const tbody = tbodyMatch[1];
  
  // Match each tr inside tbody
  const trRegex = /<tr[^>]*?>([\s\S]*?)<\/tr>/gi;
  let trMatch;
  while ((trMatch = trRegex.exec(tbody)) !== null) {
    const trContent = trMatch[1];
    
    // Match all td elements in this tr
    const tdRegex = /<td[^>]*?>([\s\S]*?)<\/td>/gi;
    const tds: string[] = [];
    let tdMatch;
    while ((tdMatch = tdRegex.exec(trContent)) !== null) {
      tds.push(tdMatch[1].trim());
    }
    
    if (tds.length >= 4) {
      const index = tds[0];
      
      // Extract registration number from link or text
      const regNoMatch = tds[1].match(/>\s*([^<]+)\s*<\/a>/) || tds[1].match(/^([^<]+)$/);
      const regNo = regNoMatch ? regNoMatch[1].trim() : tds[1];
      
      // Clean up product name (remove comments or extra spaces)
      let name = tds[2];
      name = name.replace(/<[^>]*?>/g, '').trim();
      
      // Extract holder name from link or text
      const holderMatch = tds[3].match(/>\s*([^<]+)\s*<\/a>/) || tds[3].match(/^([^<]+)$/);
      let holder = holderMatch ? holderMatch[1].trim() : tds[3];
      holder = holder.replace(/<[^>]*?>/g, '').trim();
      
      products.push({
        index,
        regNo,
        name,
        holder
      });
    }
  }
  
  return products;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const term = searchParams.get("term");
    const category = searchParams.get("category") || "1"; // "1" = Pharmaceutical, "2" = Cosmetic
    const searchBy = searchParams.get("searchBy") || "6";  // "6" = Active Ingredient, "1" = Product Name

    if (!term) {
      return NextResponse.json({ error: "Search term is required" }, { status: 400 });
    }

    const formParams = new URLSearchParams();
    formParams.append("func", "search");
    formParams.append("searchBy", searchBy);
    formParams.append("searchTxt", term);
    formParams.append("searchCat", category);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 seconds timeout

    const response = await fetch("https://quest3plus.bpfk.gov.my/pmo2/content.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      },
      body: formParams.toString(),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`NPRA page returned status ${response.status}`);
    }

    const html = await response.text();
    const products = parseHtml(html);

    return NextResponse.json({ products });
  } catch (err: any) {
    console.error("NPRA proxy error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to search NPRA database" },
      { status: 500 }
    );
  }
}
