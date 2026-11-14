const CONFIG = {
  canvas: {
    maxDevicePixelRatio: 2,
    background: "#c7e9d5"
  },
  world: {
    width: 2600,
    height: 1560,
    districts: [
      { name: "THE SUBURBS", x: 0, y: 0, width: 1260, height: 1560, color: "#b8dcae" },
      { name: "DOWNTOWN", x: 1340, y: 0, width: 1260, height: 1560, color: "#c4d9c4" }
    ],
    roads: [
      { x: 0, y: 690, width: 2600, height: 180 },
      { x: 1190, y: 0, width: 220, height: 1560 },
      { x: 330, y: 0, width: 110, height: 690 },
      { x: 1880, y: 870, width: 110, height: 690 },
      { x: 0, y: 300, width: 1260, height: 76 },
      { x: 1340, y: 1170, width: 1260, height: 76 }
    ],
    sidewalks: [
      { x: 0, y: 650, width: 2600, height: 40 },
      { x: 0, y: 870, width: 2600, height: 40 },
      { x: 1150, y: 0, width: 40, height: 1560 },
      { x: 1410, y: 0, width: 40, height: 1560 },
      { x: 300, y: 0, width: 30, height: 650 },
      { x: 440, y: 0, width: 30, height: 650 },
      { x: 1850, y: 910, width: 30, height: 650 },
      { x: 1990, y: 910, width: 30, height: 650 }
    ],
    parks: [
      { x: 520, y: 470, width: 470, height: 150, color: "#8fc98e", label: "MAPLE PARK" },
      { x: 1570, y: 430, width: 520, height: 170, color: "#93c893", label: "CITY PLAZA" },
      { x: 2130, y: 980, width: 340, height: 140, color: "#9bce96", label: "POCKET GARDEN" }
    ],
    buildings: [
      { x: 100, y: 110, width: 165, height: 135, name: "STARTER HOMES", color: "#e9c99d" },
      { x: 510, y: 100, width: 205, height: 155, name: "LEE LEE DUPLEX", color: "#e8b79c" },
      { x: 820, y: 100, width: 250, height: 155, name: "NEIGHBORHOOD HOMES", color: "#e6d09f" },
      { x: 90, y: 440, width: 160, height: 145, name: "GARDEN FLATS", color: "#d9b8a0" },
      { x: 500, y: 1000, width: 230, height: 160, name: "SUBURBAN DUPLEX", color: "#e7c495" },
      { x: 850, y: 1010, width: 225, height: 150, name: "LEE LEE SCHOOL", color: "#e3d3ad" },
      { x: 1520, y: 110, width: 245, height: 175, name: "LEE LEE CAFÉ", color: "#e5aa88" },
      { x: 1850, y: 110, width: 220, height: 175, name: "CORNER MART", color: "#dcae83" },
      { x: 2180, y: 110, width: 285, height: 175, name: "CITY LIBRARY", color: "#d4c3a5" },
      { x: 1515, y: 970, width: 250, height: 165, name: "THRIFT & PAWN", color: "#cda58d" },
      { x: 2045, y: 970, width: 290, height: 165, name: "LEASING OFFICE", color: "#d9c39d" },
      { x: 2180, y: 1290, width: 285, height: 165, name: "CITY HOMES", color: "#d1b59e" }
    ],
    entrances: [
      { id: "cafe", building: "LEE LEE CAFÉ", x: 1642.5, y: 285, width: 48 },
      { id: "school", building: "LEE LEE SCHOOL", x: 962.5, y: 1160, width: 48 }
    ],
    trees: [
      { x: 390, y: 120 }, { x: 390, y: 210 }, { x: 385, y: 420 }, { x: 385, y: 575 },
      { x: 755, y: 475 }, { x: 930, y: 565 }, { x: 555, y: 565 }, { x: 1030, y: 495 },
      { x: 790, y: 1060 }, { x: 790, y: 1140 }, { x: 115, y: 1000 }, { x: 290, y: 1120 },
      { x: 1475, y: 465 }, { x: 1610, y: 555 }, { x: 2010, y: 470 }, { x: 1640, y: 540 },
      { x: 2220, y: 1020 }, { x: 2370, y: 1080 }, { x: 2350, y: 1200 }, { x: 1460, y: 1300 },
      { x: 1780, y: 1380 }, { x: 2080, y: 1370 }, { x: 2500, y: 600 }, { x: 2300, y: 540 }
    ]
  },
  player: {
    startX: 1300,
    startY: 760,
    radius: 15,
    speed: 220,
    color: "#f3a978",
    shirtColor: "#6d9fc6",
    outlineColor: "#694d43"
  },
  characters: {
    boy: { name: "Lee Boy", image: "assets/lee-boy.jpg" },
    girl: { name: "Lee Girl", image: "assets/lee-girl.jpg" },
    cat: { name: "Lee Cat", image: "assets/lee-cat.png" },
    spriteHeight: 82
  },
  camera: {
    followSmoothing: 7
  },
  time: {
    realSecondsPerGameMinute: 1
  },
  economy: {
    startingCash: 0,
    dailyLivingCost: 10,
    rentIntervalDays: 7,
    mocaccinoCost: 10,
    cafeShiftPay: 25,
    quickJobPayout: { min: 15, max: 45 },
    shiftPayout: { min: 50, max: 120 },
    scavengedItemValue: { min: 10, max: 80 }
  },
  education: {
    startingLevel: 0,
    cafeJobRequirement: 1,
    schoolLevelPerLesson: 1
  },
  housing: [
    { tier: 0, name: "Street / Park Bench", weeklyRent: 0, deposit: 0 },
    { tier: 1, name: "Basement Studio", weeklyRent: 150, deposit: 100 },
    { tier: 2, name: "Suburban Duplex", weeklyRent: 350, deposit: 300 },
    { tier: 3, name: "Downtown Loft", weeklyRent: 750, deposit: 650 },
    { tier: 4, name: "Modern Suburban House", weeklyRent: 1500, deposit: 1200 }
  ],
  needs: {
    startingEnergy: 100,
    startingHunger: 100,
    startingMood: 100,
    thrivingThreshold: 70,
    thrivingJobBonus: 0.15,
    emptyEnergyMovementMultiplier: 0.7
  },
  colors: {
    road: "#78858a",
    roadLine: "#e7d79a",
    sidewalk: "#e6dfc9",
    sidewalkEdge: "#c9bea3",
    park: "#95cb91",
    grass: "#b8dcae",
    buildingOutline: "#896e5b",
    buildingRoof: "#f4e3c9",
    label: "#fff8e9",
    district: "#53745c"
  }
};
