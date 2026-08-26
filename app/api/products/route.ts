import { getProductPage } from "@/services/productService";

const MAX_PAGE_SIZE = 200;

function getInteger(value: string | null, fallback: number) {
  if (!value || !/^\d+$/.test(value)) return fallback;
  return Number(value);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const offset = getInteger(searchParams.get("offset"), 0);
  const limit = Math.min(
    Math.max(getInteger(searchParams.get("limit"), 100), 1),
    MAX_PAGE_SIZE
  );
  const products = await getProductPage(offset, limit);

  return Response.json(products, {
    headers: { "Cache-Control": "private, max-age=30" },
  });
}
