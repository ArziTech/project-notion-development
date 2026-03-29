"use client";

import type { ColumnDef } from "@tanstack/table-core";
import { MoreHorizontal, ReceiptText } from "lucide-react";
import Link from "next/link";
import type { GetUserTransactionReturn } from "@/actions/transaction/userTransaction";
import CreateWebsiteButton from "@/app/(protected)/dashboard/transaction-history/_components/create-website-button";
import { numberColumn } from "@/components/table/table-data";
import { DataTableColumnHeader } from "@/components/table/table-header-sortable";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Column = GetUserTransactionReturn;

export const columns: ColumnDef<Column>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className={"grid w-fit place-content-center"}>
        <Checkbox
          className={""}
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value: boolean) =>
            table.toggleAllPageRowsSelected(value)
          }
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => {
      // console.log(row);
      return (
        <div className={"grid w-fit place-content-center"}>
          <Checkbox
            className={"max-w-[100px]"}
            checked={row.getIsSelected()}
            onCheckedChange={(value: boolean) => {
              console.log("Clicked ", value);
              row.toggleSelected(value);
              console.log("is Selected ", row.getIsSelected());
            }}
            aria-label="Select row"
          />
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  numberColumn<Column>(),
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={"Transaction id"}
        className={"w-full"}
      />
    ),
  },
  {
    accessorKey: "templateName",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={"Template Name"}
        className={"w-full"}
      />
    ),
    cell: ({ row }) => (
      <div className={"w-full"}>{row.original.templateName}</div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={"Status"}
        className={"w-full"}
      />
    ),
    cell: ({ row }) => <div className={"w-full"}>{row.original.status}</div>,
  },
  {
    accessorKey: "coupon",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={"Coupon"}
        className={"w-full"}
      />
    ),
    cell: ({ row }) => (
      <div className={"w-full"}>
        {row.original.coupon || "not using coupon"}
      </div>
    ),
  },
  {
    id: "actions",
    header: () => (
      <div className="w-fit max-w-16 text-center">More actions</div>
    ),
    cell: ({ row }) => {
      console.log("from table");
      console.log(row.original);
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="size-8 w-fit max-w-16 justify-center p-0 px-4"
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={"space-y-2"}>
            <DropdownMenuItem className={"p-0"} asChild>
              <Button className={"w-full"} size={"sm"} variant={"ghost"}>
                Receipt
                <ReceiptText className={"ms-2"} />
              </Button>
            </DropdownMenuItem>
            <DropdownMenuItem className={"p-0"} asChild>
              <Button
                asChild
                className={"w-full"}
                size={"sm"}
                variant={"ghost"}
              >
                <Link href={`/payment/status/?order_id=${row.original.id}`}>
                  Receipt
                </Link>
                <ReceiptText className={"ms-2"} />
              </Button>
            </DropdownMenuItem>
            <DropdownMenuItem className={"p-0"} asChild>
              <CreateWebsiteButton
                transactionId={row.original.id}
                templateId={row.original.templateId}
                ownerId={row.original.userId}
              />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
