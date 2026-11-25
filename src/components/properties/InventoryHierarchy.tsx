import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextInput } from '@/components/forms/TextInput';
import { Select } from '@/components/forms/Select';
import { inventoryService } from '@/services/room/inventoryService';
import type { PropertyBuilding, PropertyFloor } from '@/types/property';

export function InventoryHierarchy({propertyId,buildings,onSaved,buildingId}:{propertyId:string;buildings:PropertyBuilding[];onSaved:()=>void;buildingId?:string}) {
  const [target,setTarget]=useState<{kind:'building'|'floor';id?:string;parent:string}|null>(null);
  const [name,setName]=useState(''); const [code,setCode]=useState(''); const [number,setNumber]=useState(0);
  const [description,setDescription]=useState(''); const [status,setStatus]=useState('ACTIVE');
  const [error,setError]=useState(''); const [busy,setBusy]=useState(false); const lock=useRef(false);
  function open(kind:'building'|'floor',parent:string,item?:PropertyBuilding|PropertyFloor) {
    setTarget({kind,parent,id:item?.id});setName(item?.name??'');setDescription(item?.description??'');setStatus(item?.status??'ACTIVE');
    setCode(item&&'buildingCode' in item?item.buildingCode??'':'');setNumber(item&&'floorNumber' in item?item.floorNumber??0:0);setError('');
  }
  async function save(event:React.FormEvent) {
    event.preventDefault();if(!target||lock.current)return;lock.current=true;setBusy(true);setError('');
    try {
      if(target.kind==='building') {
        const data={name,buildingCode:code,description,status};
        if(target.id)await inventoryService.updateBuilding(target.id,data);else await inventoryService.createBuilding(target.parent,data);
      } else {
        const data={name,floorNumber:number,description,status};
        if(target.id)await inventoryService.updateFloor(target.id,data);else await inventoryService.createFloor(target.parent,data);
      }
      setTarget(null);onSaved();
    } catch(cause) {setError(cause instanceof Error?cause.message:'Unable to save inventory.');}
    finally {lock.current=false;setBusy(false);}
  }
  return <section className="space-y-3 rounded-2xl border border-border bg-surface p-5">
    <div className="flex items-center justify-between"><h2 className="font-semibold">Buildings and floors</h2>{!buildingId&&<Button onClick={()=>open('building',propertyId)}>Add Building</Button>}</div>
    {buildings.filter(b=>!buildingId||b.id===buildingId).map(b=><div key={b.id} className="space-y-3 rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center gap-3"><strong>{b.name}</strong><span>{b.status}</span><Button variant="outline" onClick={()=>open('building',propertyId,b)}>Edit {b.name}</Button><Button onClick={()=>open('floor',b.id)} disabled={b.status!=='ACTIVE'}>Add Floor</Button></div>
      {b.floors.length===0&&<p>No floors yet.</p>}
      {b.floors.map(f=><div key={f.id} className="flex flex-wrap items-center justify-between gap-2"><span>{f.name} · {f.status} · {f.roomCount} rooms · {f.bedCount} beds · {f.occupiedBeds} occupied</span><Button variant="outline" onClick={()=>open('floor',b.id,f)}>Edit {f.name}</Button></div>)}
    </div>)}
    <Modal open={Boolean(target)} title={`${target?.id?'Edit':'Add'} ${target?.kind==='floor'?'Floor':'Building'}`} onClose={()=>{if(!busy)setTarget(null);}}>
      <form onSubmit={save} className="max-h-[75vh] space-y-4 overflow-y-auto"><fieldset disabled={busy} className="space-y-4">
        <TextInput label="Name" name="name" value={name} onChange={e=>setName(e.target.value)} required minLength={2} maxLength={100}/>
        {target?.kind==='building'?<TextInput label="Building code" name="code" value={code} onChange={e=>setCode(e.target.value)} required maxLength={100}/>:<TextInput label="Floor number" name="floorNumber" type="number" min={-10} max={200} value={number} onChange={e=>setNumber(Number(e.target.value))} required/>}
        <TextInput label="Description" name="description" value={description} maxLength={1000} onChange={e=>setDescription(e.target.value)}/>
        <Select label="Status" name="status" value={status} onChange={e=>setStatus(e.target.value)} options={['ACTIVE','INACTIVE','ARCHIVED'].map(value=>({value,label:value}))}/>
        {error&&<p role="alert" className="text-error">{error}</p>}<Button type="submit" disabled={busy}>{busy?'Saving…':'Save'}</Button>
      </fieldset></form>
    </Modal>
  </section>;
}
