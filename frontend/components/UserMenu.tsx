
"use client";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Avatar } from "./ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export default function UserMenu(){
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2"><Avatar /> <span>Usuário</span></CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button>Menu</Button></DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Adicionar Conta</DropdownMenuItem>
            <DropdownMenuItem>Editar Perfil</DropdownMenuItem>
            <DropdownMenuItem>Sair</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="text-sm text-slate-500">Gerencie sua conta e preferências.</CardContent>
    </Card>
  );
}
