function loadTheme(){
  const s=localStorage.getItem('nbk_style');
  if(!s)return;
  try{
    const style=JSON.parse(s);
    if(style.bg)document.documentElement.style.setProperty('--bg',style.bg);
    if(style.surface)document.documentElement.style.setProperty('--surface',style.surface);
    if(style.surface2)document.documentElement.style.setProperty('--surface2',style.surface2);
    if(style.border)document.documentElement.style.setProperty('--border',style.border);
    if(style.text)document.documentElement.style.setProperty('--text',style.text);
    if(style.text2)document.documentElement.style.setProperty('--text2',style.text2);
    if(style.accent)document.documentElement.style.setProperty('--accent',style.accent);
    if(style.font)document.body.style.fontFamily=`'${style.font}',sans-serif`;
  }catch(e){}
}
loadTheme();
