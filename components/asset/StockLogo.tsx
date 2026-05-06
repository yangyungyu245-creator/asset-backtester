import AssetLogo, { type AssetLogoType } from "@/components/common/AssetLogo";

type StockLogoProps = {
  symbol: string;
  name?: string;
  assetType?: AssetLogoType;
  size?: "sm" | "md" | "lg" | number;
  className?: string;
};

export function StockLogo({
  symbol,
  name,
  assetType,
  size = "md",
  className = "",
}: StockLogoProps) {
  return (
    <AssetLogo
      symbol={symbol}
      name={name}
      assetType={assetType}
      size={size}
      className={className}
    />
  );
}

export default StockLogo;
