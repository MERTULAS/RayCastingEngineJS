export const RADIUS = Math.PI / 180;

export function clipIntervalCalculation(currentAvailableClipAreas, castedTile) {
  // returns new available clip area and new intervals for casted tile

  let newIntervalsForCastedTile = [];
  let newAvailableClipAreas = [];

  let addRemainingClipAreasAfterThatIndex = 0;
  let earlyBreak = false;

  for (let clipAreaIndex = 0; clipAreaIndex < currentAvailableClipAreas.length; clipAreaIndex++) {
    const availableClipArea = currentAvailableClipAreas[clipAreaIndex];
    if (castedTile.startY === availableClipArea[0]) {
      if (castedTile.endY === availableClipArea[1]) {
        newIntervalsForCastedTile.push([castedTile.startY, castedTile.endY]);
        addRemainingClipAreasAfterThatIndex = clipAreaIndex;
        earlyBreak = true;
        break;
      } else if (castedTile.endY < availableClipArea[1]) {
        newIntervalsForCastedTile.push([castedTile.startY, castedTile.endY]);
        newAvailableClipAreas.push([castedTile.endY, availableClipArea[1]]);
        addRemainingClipAreasAfterThatIndex = clipAreaIndex;
        earlyBreak = true;
        break;
      } else {
        newIntervalsForCastedTile.push([castedTile.startY, availableClipArea[1]]);
        addRemainingClipAreasAfterThatIndex = clipAreaIndex;
      }
    } else if (castedTile.startY < availableClipArea[0]) {
      // Edge case maybe will be deleted in the future because it's not possible to happen
      if (castedTile.endY <= availableClipArea[0]) {
        newAvailableClipAreas.push(availableClipArea);
        addRemainingClipAreasAfterThatIndex = clipAreaIndex;
        earlyBreak = true;
        break;
      }

      if (castedTile.endY === availableClipArea[1]) {
        newIntervalsForCastedTile.push([availableClipArea[0], castedTile.endY]);
        addRemainingClipAreasAfterThatIndex = clipAreaIndex;
        earlyBreak = true;
        break;
      } else if (castedTile.endY < availableClipArea[1]) {
        newIntervalsForCastedTile.push([availableClipArea[0], castedTile.endY]);
        newAvailableClipAreas.push([castedTile.endY, availableClipArea[1]]);
        addRemainingClipAreasAfterThatIndex = clipAreaIndex;
        earlyBreak = true;
        break;
      } else {
        newIntervalsForCastedTile.push([availableClipArea[0], availableClipArea[1]]);
        addRemainingClipAreasAfterThatIndex = clipAreaIndex;
      }
    }
    else {
      if (castedTile.startY >= availableClipArea[1]) {
        newAvailableClipAreas.push(availableClipArea);
        addRemainingClipAreasAfterThatIndex = clipAreaIndex;
        continue;
      }

      if (castedTile.endY === availableClipArea[1]) {
        newIntervalsForCastedTile.push([castedTile.startY, castedTile.endY]);
        newAvailableClipAreas.push([availableClipArea[0], castedTile.startY]);
        addRemainingClipAreasAfterThatIndex = clipAreaIndex;
        earlyBreak = true;
        break;
      } else if (castedTile.endY < availableClipArea[1]) {
        newIntervalsForCastedTile.push([castedTile.startY, castedTile.endY]);
        newAvailableClipAreas.push([availableClipArea[0], castedTile.startY]);
        newAvailableClipAreas.push([castedTile.endY, availableClipArea[1]]);
        addRemainingClipAreasAfterThatIndex = clipAreaIndex;
        earlyBreak = true;
        break;
      } else {
        newIntervalsForCastedTile.push([castedTile.startY, availableClipArea[1]]);
        newAvailableClipAreas.push([availableClipArea[0], castedTile.startY]);
        addRemainingClipAreasAfterThatIndex = clipAreaIndex;
      }
    }
      
    if (earlyBreak) {
      break;
    }
  }

  newAvailableClipAreas = [...newAvailableClipAreas, ...currentAvailableClipAreas.slice(addRemainingClipAreasAfterThatIndex + 1)];

  return { newAvailableClipAreas, newIntervalsForCastedTile };
}
