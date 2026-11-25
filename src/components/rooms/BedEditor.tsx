import { useState } from 'react';
import type { Bed } from '@/types/room';
import { workflowRequest } from '@/services/http/workflows';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextInput } from '@/components/forms/TextInput';
import { Select } from '@/components/forms/Select';
export function BedEditor({bed,onSaved}:{bed:Bed;onSaved:()=>void}) {
  const [open,setOpen]=useState(false);const [number,setNumber]=useState(bed.bedNumber);const [label,setLabel]=useState(bed.label);const [rent,setRent]=useState(bed.rent);const [status,setStatus]=useState(bed.status);const [error,setError]=useState('');const [busy,setBusy]=useState(false);
  return <><Button variant="outline" disabled={bed.status==='OCCUPIED'} onClick={()=>setOpen(true)}>Edit {bed.label}</Button><Modal open={open} title={`Edit ${bed.label}`} onClose={()=>{if(!busy)setOpen(false);}}><form className="space-y-4" onSubmit={async e=>{e.preventDefault();if(busy)return;setBusy(true);setError('');try{await workflowRequest('patch',`/beds/${bed.id}`,{bedNumber:number,label,rent,status});setOpen(false);onSaved();}catch(cause){setError(cause instanceof Error?cause.message:'Unable to update bed.');}finally{setBusy(false);}}}>
    <TextInput label="Bed number" name="bedNumber" value={number} maxLength={16} onChange={e=>setNumber(e.target.value)} required/>
    <TextInput label="Bed label" name="bedLabel" value={label} maxLength={80} onChange={e=>setLabel(e.target.value)} required/>
    <TextInput label="Bed rent" name="bedRent" type="number" min={1} step="0.01" value={rent} onChange={e=>setRent(Number(e.target.value))} required/>
    <Select label="Bed status" name="bedStatus" value={status} onChange={e=>setStatus(e.target.value as Bed['status'])} options={['AVAILABLE','RESERVED','MAINTENANCE','BLOCKED'].map(value=>({value,label:value}))}/>
    {error&&<p role="alert">{error}</p>}<Button type="submit" disabled={busy}>{busy?'Saving…':'Save Bed'}</Button>
  </form></Modal></>;
}
