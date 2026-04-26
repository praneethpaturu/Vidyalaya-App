"use server";
import { revalidatePath } from "next/cache";
import { processOutbox } from "@/lib/notify";

export async function processOutboxAction() {
  await processOutbox(50);
  revalidatePath("/messages");
}
