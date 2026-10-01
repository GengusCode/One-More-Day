import {EVENTS,WORK_DECISIONS} from '../data/events.js';

const LABELS={'business-equipment':'Business equipment',salary:'Shift wages','business-income':'Business sales after costs','living-costs':'Living costs','travel-taxi':'Taxi fare','travel-car':'Fuel','travel-bicycle':'Bicycle travel','travel-ehailing':'E-hailing fare','travel-taxi-passage':'Taxi fare','transport-asset':'Transport purchase','vehicle-purchase':'Vehicle purchase','vehicle-running-costs':'Vehicle running costs','sports-car-finance':'Car finance payment','vehicle-repossession':'Repossession debt','stokvel-contribution':'Stokvel contribution','stokvel-payout':'Stokvel payout','betway-stake':'Slot stake','betway-win':'Slot payout','betway-jackpot':'Slot jackpot','staffed-business-absence':'Staff-run business income','e-hailing-driver':'Driver earnings'};
export function transactionLabel(tx) {
  return tx.label || LABELS[tx.source] || [...EVENTS,...WORK_DECISIONS].find(event=>event.id===tx.source)?.title || (tx.source.endsWith('-consequence')?'Earlier decision consequence':'Other life expense or income');
}
export function buildMoneyReport(state,{day=state.calendar.day,recent=false}={}) {
  const transactions=(state.finances.transactions || []).filter(tx=>recent || tx.day===day);
  const rows=!recent && state.finances.dailyLedger?.day===day ? state.finances.dailyLedger.entries.map((row,index)=>({...row,label:transactionLabel(row),id:'daily-'+index,day})) : transactions.flatMap(tx=>{
    const details=Array.isArray(tx.breakdown) && tx.breakdown.reduce((sum,row)=>sum+row.amount,0)===tx.amount ? tx.breakdown : [{label:transactionLabel(tx),amount:tx.amount}];
    return details.filter(row=>row.amount!==0).map((row,index)=>({...row,id:tx.id+'-'+index,day:tx.day}));
  });
  const moneyIn=rows.filter(row=>row.amount>0).reduce((sum,row)=>sum+row.amount,0);
  const moneyOut=-rows.filter(row=>row.amount<0).reduce((sum,row)=>sum+row.amount,0);
  return {rows,moneyIn,moneyOut,net:moneyIn-moneyOut};
}
