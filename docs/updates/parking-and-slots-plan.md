# Parking and slots implementation plan

Goal: Complete the approved individual vehicle, home/work parking, housing capacity and fixed slot odds requests.
Architecture: Keep existing purchase finance records; derive individual vehicles and store their parking separately. Share inventory between Garage, Transport and travel; fleet income counts vans at work. Existing saves retain all ownership.

1. Add failing parking tests for individual van names, home capacity, moving vans, reduced fleet sales, personal travel, save/load, housing costs and invalid actions. Implement inventory and actions in vehicles.js, integrate state, travel, day, household, phone and app. Run all tests, commit and publish.
2. Replace varying slots with fixed weights: 70% loss, 15% stake back, 10% 3x, 4.9% 8x, 0.1% 118x; theoretical RTP 96%. Update intentional previous payout expectations; test complete distribution, fixed luck independence, staged payout and duplicate settlement. Run all tests, commit and publish.

Review focus: Old saves with multiple personal cars; full home parking; driver assignment conflicts; unavailable or repossessed vehicles; pending bets restored after refresh.
