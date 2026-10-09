import { generateSeating } from './seatingEngine';
self.onmessage=e=>{try{self.postMessage({ok:true,result:generateSeating(e.data)});}catch{self.postMessage({ok:false});}};
