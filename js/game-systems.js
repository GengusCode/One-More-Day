(function (root) {
  "use strict";

  function shuffleChoices(choices, random = Math.random) {
    const shuffled = choices.slice();
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
  }

  function orderChoices(choices, storedIds, random = Math.random) {
    const byId = new Map(choices.map((choice) => [choice.id, choice]));
    const validIds = Array.isArray(storedIds)
      ? storedIds.filter((id) => byId.has(id))
      : [];
    const missing = choices.filter((choice) => !validIds.includes(choice.id));
    const ids = validIds.concat(shuffleChoices(missing, random).map((choice) => choice.id));
    return { ids, items: ids.map((id) => byId.get(id)) };
  }

  function branchForChoice(choices, choiceId) {
    const choice = choices.find((item) => item.id === choiceId);
    return choice && choice.followUp ? choice.followUp : null;
  }

  function nextChaseTarget(random = Math.random, previousLane = -1) {
    let lane = Math.floor(random() * 3);
    if (lane === previousLane) lane = (lane + 1) % 3;
    const laneCenters = [14, 45, 76];
    return {
      lane,
      x: Math.max(8, Math.min(82, laneCenters[lane] + (random() - 0.5) * 10)),
      y: 10 + random() * 64,
      duration: 360 + Math.round(random() * 400),
    };
  }

  root.GameSystems = Object.freeze({ shuffleChoices, orderChoices, branchForChoice, nextChaseTarget });
})(globalThis);
