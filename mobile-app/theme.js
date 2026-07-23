(function(){
var s=localStorage.getItem('nbk_style');
if(!s)return;
try{
var style=JSON.parse(s);
var r=document.documentElement;
if(style.bg)r.style.setProperty('--bg',style.bg);
if(style.surface)r.style.setProperty('--surface',style.surface);
if(style.surface2)r.style.setProperty('--surface2',style.surface2);
if(style.border)r.style.setProperty('--border',style.border);
if(style.text)r.style.setProperty('--text',style.text);
if(style.text2)r.style.setProperty('--text2',style.text2);
if(style.accent)r.style.setProperty('--accent',style.accent);
if(style.font)r.style.setProperty('--font',style.font);
}catch(e){}
})();
