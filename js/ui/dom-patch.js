const key = node => node?.nodeType === 1 ? node.getAttribute('id') || node.getAttribute('data-card-id') : null;

// Keep existing controls and scrolling containers while changing their contents.
export function patchNode(current,next) {
  if(current.nodeType!==next.nodeType || current.nodeName!==next.nodeName || (key(current) && key(next) && key(current)!==key(next))) {
    current.replaceWith(next.cloneNode(true));return;
  }
  if(current.nodeType!==1) {if(current.nodeValue!==next.nodeValue) current.nodeValue=next.nodeValue;return;}
  for(const {name} of Array.from(current.attributes)) if(next.getAttribute(name)===null && !(current.nodeName==='DETAILS' && name==='open')) current.removeAttribute(name);
  for(const {name,value} of Array.from(next.attributes)) if(current.getAttribute(name)!==value) current.setAttribute(name,value);
  if(current.getAttribute('id')==='moneyFeedback') return;
  patchChildren(current,next);
}

export function patchChildren(current,next) {
  const wanted=Array.from(next.childNodes);
  wanted.forEach((child,index)=>{
    let existing=current.childNodes[index];
    const childKey=key(child);
    if(childKey && key(existing)!==childKey) {
      const match=Array.from(current.childNodes).find(node=>key(node)===childKey);
      current.insertBefore(match || child.cloneNode(true),existing || null);
      existing=current.childNodes[index];
    }
    if(!existing) current.insertBefore(child.cloneNode(true),null);
    else patchNode(existing,child);
  });
  while(current.childNodes.length>wanted.length) current.childNodes[current.childNodes.length-1].remove();
}
