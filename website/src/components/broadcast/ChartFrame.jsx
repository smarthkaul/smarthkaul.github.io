// Frames an exported analysis image inside the broadcast system. Notebook
// screenshots will not match the palette or the type; the border and mono
// caption bar make the image read as a figure rather than as decoration.
const ChartFrame = ({ src, alt, caption, width, height }) => (
  <figure className="my-8 border border-charcoal/15 rounded-xl overflow-hidden bg-white">
    {caption && (
      <figcaption className="bg-charcoal/5 border-b border-charcoal/10 px-4 py-2 font-mono text-[0.7rem] uppercase tracking-widest text-charcoal/50">
        {caption}
      </figcaption>
    )}
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      className="block w-full h-auto"
    />
  </figure>
);

export default ChartFrame;
