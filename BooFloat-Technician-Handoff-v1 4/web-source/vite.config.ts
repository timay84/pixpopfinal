import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import {modes} from './lib/motion';
export default defineConfig({base:'./',plugins:[react(),{name:'individual-motion-pages',enforce:'post',generateBundle(_,bundle){const entry=bundle['index.html'];if(!entry||entry.type!=='asset')return;for(const [i,m] of modes.entries())this.emitFile({type:'asset',fileName:'motions/'+String(i+1).padStart(2,'0')+'-'+m.id+'.html',source:String(entry.source).replace('<html lang="zh-CN">','<html lang="zh-CN" data-solo="true" data-motion="'+m.id+'">')});}}],resolve:{alias:{'@':fileURLToPath(new URL('.',import.meta.url))}},css:{postcss:{plugins:[tailwindcss()]}},build:{rollupOptions:{input:{main:fileURLToPath(new URL('./index.html',import.meta.url)),models:fileURLToPath(new URL('./models/index.html',import.meta.url))}}}});
