import assert from 'node:assert/strict';
import {test} from 'node:test';
const dom=await import('../js/ui/dom-patch.js').catch(e=>{if(e.code==='ERR_MODULE_NOT_FOUND')return {};throw e;});
// A DOM boundary adapter lets the real patcher run without a browser dependency.
class Element {
 constructor(tag,attrs={},children=[]){this.nodeType=1;this.nodeName=tag;this.attrs={...attrs};this.childNodes=children;this.parentNode=null;this.value='';this.scrollTop=0;children.forEach(n=>n.parentNode=this);}
 get attributes(){return Object.entries(this.attrs).map(([name,value])=>({name,value}));}
 getAttribute(k){return this.attrs[k]??null;}setAttribute(k,v){this.attrs[k]=v;}removeAttribute(k){delete this.attrs[k];}
 cloneNode(){return new Element(this.nodeName,this.attrs,this.childNodes.map(n=>n.cloneNode()));}
 insertBefore(n,before){if(n.parentNode)n.remove();const i=before?this.childNodes.indexOf(before):this.childNodes.length;this.childNodes.splice(i,0,n);n.parentNode=this;}
 remove(){const p=this.parentNode;if(p)p.childNodes.splice(p.childNodes.indexOf(this),1);this.parentNode=null;}
 replaceWith(n){this.parentNode.insertBefore(n,this);this.remove();}
}
test('updating a phone card keeps the existing screen, stake input, reels and scroll position',()=>{
 assert.equal(typeof dom.patchNode,'function');
 const input=new Element('INPUT',{id:'betAmount',type:'number'});input.value='75';
 const reels=new Element('DIV',{class:'slot-machine'});
 const screen=new Element('DIV',{class:'phone-screen'},[input,reels]);screen.scrollTop=140;
 const next=new Element('DIV',{class:'phone-screen'},[new Element('INPUT',{id:'betAmount',type:'number',disabled:''}),new Element('DIV',{class:'slot-machine slot-machine--spinning'})]);
 dom.patchNode(screen,next);
 assert.equal(screen.childNodes[0],input);assert.equal(screen.childNodes[1],reels);
 assert.equal(input.value,'75');assert.equal(input.getAttribute('disabled'),'');
 assert.equal(screen.scrollTop,140);assert.equal(reels.getAttribute('class'),'slot-machine slot-machine--spinning');
});
test('keyed phone cards survive an inserted card and obsolete cards are removed',()=>{
 assert.equal(typeof dom.patchNode,'function');
 const business=new Element('ARTICLE',{'data-card-id':'business'});
 const garage=new Element('ARTICLE',{'data-card-id':'garage'});
 const cards=new Element('DIV',{},[business,garage]);
 const next=new Element('DIV',{},[new Element('ARTICLE',{'data-card-id':'notice'}),new Element('ARTICLE',{'data-card-id':'business'})]);
 dom.patchNode(cards,next);
 assert.equal(cards.childNodes.length,2);assert.equal(cards.childNodes[1],business);
 assert.equal(garage.parentNode,null);
});
