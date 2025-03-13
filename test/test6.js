const checkPlayersXp = (player1xp, player2xp) => {
    // Function to check if xp is in range 0-10
    const inRangeA = (xp) => (xp >= 0 && xp <= 10);
    
    // Function to check if xp is in range 5-40
    const inRangeB = (xp) => (xp >= 5 && xp <= 40);
  
    // Function to check if xp is in range 10-50
    const inRangeC = (xp) => (xp >= 10 && xp <= 50);
  
    // Function to check if xp is in range 20 to max (let's assume JavaScript's safe integer limit)
    const inRangeD = (xp) => (xp >= 20);
  
    // First, check if both players' xp are in range A (0-10)
    if (inRangeA(player1xp) && inRangeA(player2xp)) {
      return true;  // Both are in the 0-10 range
    }
    
    // Then, check if both are in range B (5-40)
    if (inRangeB(player1xp) && inRangeB(player2xp)) {
      return true;  // Both are in the 5-40 range
    }
  
    // Next, check if both are in range C (10-50)
    if (inRangeC(player1xp) && inRangeC(player2xp)) {
      return true;  // Both are in the 10-50 range
    }
  
    // Finally, check if both are in range D (20-max)
    if (inRangeD(player1xp) && inRangeD(player2xp)) {
      return true;  // Both are in the 20-max range
    }
  
    // Return false if they do not fit together in any range
    return false;
  };
  
//   // Example usage:
//   checkPlayersXp(7, 15).then(result => {
//     console.log("Both players in same range for (2, 8):", result);
//   });

  console.log(`${checkPlayersXp(2,17)}`);

  