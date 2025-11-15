// app/api/plant-image/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  
  if (!id || isNaN(Number(id))) {
    return NextResponse.json({ error: "id query is required" }, { status: 400 });
  }

  const base = path.join(process.cwd(), "public", "images", "plants");
  const exts = [".jpg", ".jpeg", ".png", ".webp", ".JPG", ".JPEG", ".PNG", ".WEBP"];

  // Try to find the image with any extension
  for (const ext of exts) {
    const imagePath = path.join(base, `${id}${ext}`);
    
    try {
      await fs.access(imagePath);
      
      // Found the image, redirect to it with proper caching headers
      const imageUrl = new URL(`/images/plants/${id}${ext}`, req.url);
      const response = NextResponse.redirect(imageUrl);
      
      // Add caching headers for better performance
      response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
      
      return response;
    } catch {
      // File doesn't exist with this extension, try next
      continue;
    }
  }

  // No image found, redirect to placeholder
  const placeholderUrl = new URL("/images/placeholder-plant.jpg", req.url);
  const response = NextResponse.redirect(placeholderUrl);
  
  // Shorter cache for placeholder (might get replaced later)
  response.headers.set("Cache-Control", "public, max-age=3600");
  
  return response;
}