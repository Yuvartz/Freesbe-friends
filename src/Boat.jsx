export default function Boat({ boat }) {
  const { folder, x, y, frame, dir, scale, rot, yOffset = 0 } = boat;
  let imgFile;
  let width = 128, height = 128, extraYOffset = 0;
  
  if (folder === 'boat1') {
    imgFile = `boat1_${frame}.png`;
    width = 70;
    height = 70;
    extraYOffset = 30 + 151 + 49 - 15 - 8 + 6;
  } else if (folder === 'boat2') {
    imgFile = `Boat2_${frame}.png`;
    width = 60;
    height = 60;
    extraYOffset = (yOffset || 0) + 49 - 45;
  } else if (folder === 'boat3') {
    imgFile = `boat3_${frame}.png`;
    width = 60;
    height = 60;
    extraYOffset = (yOffset || 0) + 15 + 15;
  } else {
    imgFile = `${folder}_${frame}.png`;
  }
  
  const imgPath = process.env.PUBLIC_URL + `/boat/${folder}/${imgFile}`;

  return (
    <img
      src={imgPath}
      alt={folder}
      style={{
        position: 'absolute',
        left: x,
        bottom: y + extraYOffset - 18,
        width,
        height,
        imageRendering: 'pixelated',
        transform: `scale(${scale}) scaleX(${dir}) rotate(${rot}deg)`,
        transformOrigin: '50% 50%',
        pointerEvents: 'none',
        zIndex: 5,
      }}
    />
  );
} 