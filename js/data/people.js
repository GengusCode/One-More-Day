export const PERSON_POOLS = Object.freeze({
  guardian: Object.freeze([
    { name: "Gogo Thandi", trait: "protective" },
    { name: "Uncle Yusuf", trait: "practical" },
    { name: "Aunty Charmaine", trait: "straight-talking" },
    { name: "Mama Palesa", trait: "encouraging" },
    { name: "Tata Mandla", trait: "traditional" },
  ]),
  friend: Object.freeze([
    { name: "Lwazi", trait: "funny" },
    { name: "Kiara", trait: "ambitious" },
    { name: "Tshepo", trait: "loyal" },
    { name: "Nadia", trait: "fearless" },
    { name: "Mieke", trait: "creative" },
  ]),
  classmate: Object.freeze([
    { name: "Anele", trait: "competitive" },
    { name: "Reece", trait: "clever" },
    { name: "Boitumelo", trait: "observant" },
    { name: "Imraan", trait: "confident" },
    { name: "Zinhle", trait: "unpredictable" },
  ]),
  mentor: Object.freeze([
    { name: "Ms Naidoo", trait: "demanding" },
    { name: "Mr Mokoena", trait: "patient" },
    { name: "Coach Williams", trait: "motivating" },
    { name: "Ma’am Daniels", trait: "sharp" },
    { name: "Mr van Wyk", trait: "resourceful" },
  ]),
});

export const PERSON_TYPES = Object.freeze(["guardian", "friend", "classmate", "mentor"]);

export const STARTER_REACTIONS = Object.freeze({
  guardian: Object.freeze(["proud", "concerned", "watchful"]),
  friend: Object.freeze(["hyped", "teasing", "supportive"]),
  classmate: Object.freeze(["competitive", "curious", "unimpressed"]),
  mentor: Object.freeze(["hopeful", "measuring-you", "encouraging"]),
});

export const STARTER_SCORES = Object.freeze({
  guardian: 68,
  friend: 64,
  classmate: 46,
  mentor: 55,
});
