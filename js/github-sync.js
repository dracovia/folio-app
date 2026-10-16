/* Folio GitHub backup transport. No packages, no analytics, no third-party scripts. */
(() => {
  'use strict';
  const FILE = 'folio-data.encrypted.json';
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const enc = bytes => {
    let raw = '';
    for(let i=0;i<bytes.length;i+=8192) raw += String.fromCharCode(...bytes.subarray(i,i+8192));
    return btoa(raw);
  };
  const dec = value => {
    if(typeof value !== 'string' || !/^[A-Za-z0-9+\/\s]*={0,2}$/.test(value)) throw Error('Invalid base64 data.');
    const raw=atob(value.replace(/\s/g,''));
    return Uint8Array.from(raw,c=>c.charCodeAt(0));
  };
  const validContext = () => {
    if(!window.isSecureContext || !crypto?.subtle) throw Error('Encrypted sync requires HTTPS or localhost (127.0.0.1).');
  };
  async function derive(passphrase,salt,usages) {
    const material=await crypto.subtle.importKey('raw',encoder.encode(passphrase),'PBKDF2',false,['deriveKey']);
    return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations:600000},material,{name:'AES-GCM',length:256},false,usages);
  }
  async function encrypt(json,passphrase){
    validContext();
    if(typeof passphrase!=='string'||passphrase.length<12)throw Error('Choose a sync password of at least 12 characters.');
    const salt=crypto.getRandomValues(new Uint8Array(16));
    const iv=crypto.getRandomValues(new Uint8Array(12));
    const key=await derive(passphrase,salt,['encrypt']);
    const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,encoder.encode(json));
    return JSON.stringify({format:'folio-github-encrypted',version:1,kdf:'PBKDF2-SHA256',iterations:600000,cipher:'AES-256-GCM',salt:enc(salt),iv:enc(iv),data:enc(new Uint8Array(ciphertext))},null,2);
  }
  async function decrypt(text,passphrase){
    validContext();
    let envelope;
    try {envelope=JSON.parse(text)}catch{throw Error('The remote file is not valid encrypted Folio data.')}
    if(!envelope || envelope.format!=='folio-github-encrypted' || envelope.version!==1 || envelope.cipher!=='AES-256-GCM' || envelope.kdf!=='PBKDF2-SHA256'||envelope.iterations!==600000)throw Error('Unsupported encrypted Folio file.');
    const salt=dec(envelope.salt),iv=dec(envelope.iv),cipher=dec(envelope.data);
    if(salt.length!==16||iv.length!==12||cipher.length<16)throw Error('The encrypted backup is damaged.');
    const key=await derive(passphrase,salt,['decrypt']);
    try{return decoder.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv},key,cipher))}
    catch{throw Error('Incorrect sync password, or the remote backup is damaged.')}
  }
  function url(owner,repo,path=''){
    if(!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(owner)||!/^[\w.-]{1,100}$/.test(repo)||repo==='.'||repo==='..')throw Error('Enter a valid GitHub username and repository name.');
    return `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}${path}`;
  }
  async function request(config,token,path,method='GET',body){
    if(!token)throw Error('Enter a GitHub access token with Contents read/write permission.');
    let response;
    try{response=await fetch(url(config.owner,config.repo,path),{
      method,headers:{'Accept':'application/vnd.github+json','Authorization':`Bearer ${token}`,'X-GitHub-Api-Version':'2022-11-28',...(body?{'Content-Type':'application/json'}:{})},
      ...(body?{body:JSON.stringify(body)}:{}),cache:'no-store'
    })}catch{throw Error('Could not reach GitHub. Check your internet connection.')}
    if(response.status===404 && path.startsWith('/contents/'))return {missing:true};
    if(!response.ok){let message='';try{message=(await response.json()).message||''}catch{};
      if(response.status===401)throw Error('GitHub rejected this token. Create a valid fine-grained token.');
      if(response.status===403)throw Error('Access denied. Grant Contents: Read and write to this private repository.');
      if(response.status===404)throw Error('Repository not found. Check username, repository, and token access.');
      if(response.status===409 || response.status===422)throw Error('GitHub reported a write conflict. Pull the latest data before trying again.');
      throw Error(`GitHub error ${response.status}${message?': '+message.slice(0,120):''}`);
    }
    return response.json();
  }
  async function verify(config,token){
    const repo=await request(config,token,'');
    if(repo.private!==true)throw Error('For safety, Folio only syncs to PRIVATE GitHub repositories.');
    return repo;
  }
  async function read(config,token){
    const b=config.branch||'main';
    const data=await request(config,token,`/contents/${FILE}?ref=${encodeURIComponent(b)}`);
    if(data.missing)return null;
    if(data.type!=='file'||data.encoding!=='base64'||!data.content)throw Error('Remote file is not readable. GitHub Contents API supports files up to 1 MB.');
    return {sha:data.sha,contents:decoder.decode(dec(data.content))};
  }
  async function write(config,token,contents,sha){
    // GitHub Contents API reliably accepts small files and requires SHA to replace an existing version.
    if(encoder.encode(contents).length>900000)throw Error('Encrypted backup is too large for this GitHub sync method (900 KB maximum). Keep using local JSON backups.');
    const obj={message:`Folio encrypted backup ${new Date().toISOString().slice(0,10)}`,branch:config.branch||'main',content:enc(encoder.encode(contents))};
    if(sha)obj.sha=sha;
    const out=await request(config,token,`/contents/${FILE}`,'PUT',obj);
    if(!out.content?.sha)throw Error('GitHub did not confirm the uploaded file.');
    return out.content.sha;
  }
  window.FolioGitHub={verify,read,write,encrypt,decrypt,filename:FILE};
})();
