// Global environmental scene rendered behind every page: a real photographic
// mountainous floral landscape (StockCake, free for commercial use — see
// public/ASSET-ATTRIBUTION.txt). Fixed behind content so the translucent glass
// panels float over it in 3D.
export function Environment() {
  return (
    <div className="scene-env" aria-hidden>
      <div className="se-photo-sky" />
      <div className="se-haze" />
    </div>
  );
}
