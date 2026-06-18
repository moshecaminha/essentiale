"use client";

import Link from "next/link";
import { Pencil, Copy, Trash2 } from "lucide-react";
import { deleteProduct, duplicateProduct } from "@/app/admin/produtos/actions";

export default function ProductRowActions({ id }: { id: string }) {
  return (
    <div className="row-actions">
      <Link href={`/admin/produtos/${id}`} className="adm-btn ghost sm" title="Editar"><Pencil size={14} /></Link>
      <form action={duplicateProduct}>
        <input type="hidden" name="id" value={id} />
        <button type="submit" className="adm-btn ghost sm" title="Copiar produto"><Copy size={14} /></button>
      </form>
      <form action={deleteProduct} onSubmit={(e) => { if (!confirm("Excluir este produto? Esta ação não pode ser desfeita.")) e.preventDefault(); }}>
        <input type="hidden" name="id" value={id} />
        <button type="submit" className="adm-btn danger sm" title="Excluir"><Trash2 size={14} /></button>
      </form>
    </div>
  );
}
