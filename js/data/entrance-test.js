const q = (id, text, answers, correct) => ({ id, text, choices: answers.map((label,index)=>({id:['a','b','c','d'][index],label})), correct });
export const ENTRANCE_QUESTIONS = Object.freeze([
 q('change','You pay R100 for three items costing R20 each. What change should you receive?',['R20','R30','R40','R60'],'c'),
 q('discount','A R200 item has a 10% discount. How much is the discount?',['R10','R20','R40','R180'],'b'),
 q('sequence','What comes next: 2, 4, 8, 16, …?',['18','24','30','32'],'d'),
 q('time','A meeting starts at 09:30 and lasts 45 minutes. When does it finish?',['10:15','10:30','09:45','11:15'],'a'),
 q('budget','You have R150. Food costs R75, electricity R40 and transport R30. What remains?',['R15','R5','R25','R35'],'b'),
 q('logic','Every bus is a vehicle. Which statement must be true?',['Every vehicle is a bus','No bus is a vehicle','A bus is a vehicle','Every bus is a car'],'c'),
 q('reading','A parcel says “Fragile: handle with care”. What should you do?',['Throw it onto a shelf','Stack heavy boxes on it','Open it without permission','Move it gently'],'d'),
 q('average','You earn R60, R90 and R120 over three shifts. What is the average per shift?',['R90','R80','R100','R270'],'a'),
]);
export function createEntranceQuiz(random = Math.random) {
 const order = ENTRANCE_QUESTIONS.map(question=>question.id);
 for(let i=order.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 return {order,answers:[],index:0};
}
