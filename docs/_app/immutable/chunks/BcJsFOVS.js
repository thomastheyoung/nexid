import{b as F,h as A,y as G,E as H,H as z,z as V,A as W,B as Z,C as O,D,a as N,F as B,U as J,c as M,G as T,I as Q,L as X,p as q,J as k,P as x,k as E,K as ee,M as re,N as ne,O as te,i as C,Q as se,S as $,R as K,l as ie,T as ae,V as le,W as ue,X as S}from"./BJkrsQp0.js";function ve(e,r,[t,n]=[0,0]){A&&t===0&&G();var s=e,f=null,l=null,i=J,b=t>0?H:0,a=!1;const v=(c,u=!0)=>{a=!0,d(u,c)},d=(c,u)=>{if(i===(i=c))return;let _=!1;if(A&&n!==-1){if(t===0){const p=s.data;p===z?n=0:p===V?n=1/0:(n=parseInt(p.substring(1)),n!==n&&(n=i?1/0:-1))}const h=n>t;!!i===h&&(s=W(),Z(s),O(!1),_=!0,n=-1)}i?(f?D(f):u&&(f=N(()=>u(s))),l&&B(l,()=>{l=null})):(l?D(l):u&&(l=N(()=>u(s,[t+1,n]))),f&&B(f,()=>{f=null})),_&&O(!0)};F(()=>{a=!1,r(v),a||d(null,null)},b),A&&(s=M)}let g=!1;function fe(e){var r=g;try{return g=!1,[e(),g]}finally{g=r}}const oe={get(e,r){if(!e.exclude.includes(r))return e.props[r]},set(e,r){return!1},getOwnPropertyDescriptor(e,r){if(!e.exclude.includes(r)&&r in e.props)return{enumerable:!0,configurable:!0,value:e.props[r]}},has(e,r){return e.exclude.includes(r)?!1:r in e.props},ownKeys(e){return Reflect.ownKeys(e.props).filter(r=>!e.exclude.includes(r))}};function he(e,r,t){return new Proxy({props:e,exclude:r},oe)}const ce={get(e,r){let t=e.props.length;for(;t--;){let n=e.props[t];if(S(n)&&(n=n()),typeof n=="object"&&n!==null&&r in n)return n[r]}},set(e,r,t){let n=e.props.length;for(;n--;){let s=e.props[n];S(s)&&(s=s());const f=T(s,r);if(f&&f.set)return f.set(t),!0}return!1},getOwnPropertyDescriptor(e,r){let t=e.props.length;for(;t--;){let n=e.props[t];if(S(n)&&(n=n()),typeof n=="object"&&n!==null&&r in n){const s=T(n,r);return s&&!s.configurable&&(s.configurable=!0),s}}},has(e,r){if(r===$||r===K)return!1;for(let t of e.props)if(S(t)&&(t=t()),t!=null&&r in t)return!0;return!1},ownKeys(e){const r=[];for(let t of e.props){S(t)&&(t=t());for(const n in t)r.includes(n)||r.push(n)}return r}};function me(...e){return new Proxy({props:e},ce)}function U(e){var r;return((r=e.ctx)==null?void 0:r.d)??!1}function be(e,r,t,n){var L;var s=(t&le)!==0,f=!ie||(t&ae)!==0,l=(t&se)!==0,i=(t&ue)!==0,b=!1,a;l?[a,b]=fe(()=>e[r]):a=e[r];var v=$ in e||K in e,d=l&&(((L=T(e,r))==null?void 0:L.set)??(v&&r in e&&(o=>e[r]=o)))||void 0,c=n,u=!0,_=!1,h=()=>(_=!0,u&&(u=!1,i?c=C(n):c=n),c);a===void 0&&n!==void 0&&(d&&f&&Q(),a=h(),d&&d(a));var p;if(f)p=()=>{var o=e[r];return o===void 0?h():(u=!0,_=!1,o)};else{var y=(s?q:k)(()=>e[r]);y.f|=X,p=()=>{var o=E(y);return o!==void 0&&(c=void 0),o===void 0?c:o}}if((t&x)===0)return p;if(d){var j=e.$$legacy;return function(o,P){return arguments.length>0?((!f||!P||j||b)&&d(P?p():o),o):p()}}var R=!1,I=te(a),m=q(()=>{var o=p(),P=E(I);return R?(R=!1,P):I.v=o});return l&&E(m),s||(m.equals=ee),function(o,P){if(arguments.length>0){const w=P?E(m):f&&l?re(o):o;if(!m.equals(w)){if(R=!0,ne(I,w),_&&c!==void 0&&(c=w),U(m))return o;C(()=>E(m))}return o}return U(m)?m.v:E(m)}}const _e="modulepreload",de=function(e,r){return new URL(e,r).href},Y={},Pe=function(r,t,n){let s=Promise.resolve();if(t&&t.length>0){const l=document.getElementsByTagName("link"),i=document.querySelector("meta[property=csp-nonce]"),b=(i==null?void 0:i.nonce)||(i==null?void 0:i.getAttribute("nonce"));s=Promise.allSettled(t.map(a=>{if(a=de(a,n),a in Y)return;Y[a]=!0;const v=a.endsWith(".css"),d=v?'[rel="stylesheet"]':"";if(!!n)for(let _=l.length-1;_>=0;_--){const h=l[_];if(h.href===a&&(!v||h.rel==="stylesheet"))return}else if(document.querySelector(`link[href="${a}"]${d}`))return;const u=document.createElement("link");if(u.rel=v?"stylesheet":_e,v||(u.as="script"),u.crossOrigin="",u.href=a,b&&u.setAttribute("nonce",b),document.head.appendChild(u),v)return new Promise((_,h)=>{u.addEventListener("load",_),u.addEventListener("error",()=>h(new Error(`Unable to preload CSS for ${a}`)))})}))}function f(l){const i=new Event("vite:preloadError",{cancelable:!0});if(i.payload=l,window.dispatchEvent(i),!i.defaultPrevented)throw l}return s.then(l=>{for(const i of l||[])i.status==="rejected"&&f(i.reason);return r().catch(f)})};export{Pe as _,ve as i,be as p,he as r,me as s};
