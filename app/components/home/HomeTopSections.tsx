import ShopByBrands from "../ShopByBrands"
import { getHomeBrandsCached } from "@/lib/supabase/cache"

export default async function HomeTopSections() {
  const homeBrandsResult = await getHomeBrandsCached()
  const homeBrands = homeBrandsResult.error ? [] : homeBrandsResult.data

  return <ShopByBrands brands={homeBrands} />
}
