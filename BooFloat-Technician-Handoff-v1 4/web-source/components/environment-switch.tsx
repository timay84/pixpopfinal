'use client';
import {Sun,MoonStar} from 'lucide-react';
import {ToggleGroup,ToggleGroupItem} from '@/components/ui/toggle-group';
import type {Environment} from '@/lib/environment';

export function EnvironmentSwitch({value,onChange}:{value:Environment,onChange:(value:Environment)=>void}) {
  return <ToggleGroup className="environment-switch" aria-label="环境光照" value={[value]} onValueChange={values=>{const next=values[0];if(next==='light'||next==='dark')onChange(next);}}>
    <ToggleGroupItem value="light" aria-label="亮色环境" title="亮色环境"><Sun size={17}/></ToggleGroupItem>
    <ToggleGroupItem value="dark" aria-label="暗色环境" title="暗色环境"><MoonStar size={17}/></ToggleGroupItem>
  </ToggleGroup>;
}
