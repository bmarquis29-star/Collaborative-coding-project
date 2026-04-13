function getMouthGap(points) {
  // Landmark 13: Upper lip inner, 14: Lower lip inner
  let p13 = points[13];
  let p14 = points[14];
  return dist(p13.x, p13.y, p14.x, p14.y);
}

function getFaceScale(points) {
  // Distance between outer eye corners (33 and 263) 
  // Higher value = user is closer to camera
  return dist(points[33].x, points[33].y, points[263].x, points[263].y);
}
