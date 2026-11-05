import { ArrowLeft, Check, Crown, Info } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PLAN, PROMPTPAY_ID, promptPayPayload } from "@/lib/payment";
import { cn } from "@/lib/utils";

const PERKS = ["สั่งงานบอทได้ไม่จำกัด", "เชื่อม n8n ส่งงานจริง", "ถาม AI ผู้ช่วยได้ต่อเนื่อง"];
const baht = (n: number) => `฿${n.toLocaleString("th-TH")}`;

export function UpgradeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [step, setStep] = useState<"plan" | "pay">("plan");
  const sample = !PROMPTPAY_ID;
  const qrValue = sample ? "ตัวอย่าง QR — ยังไม่ใช่บัญชีรับเงินจริง" : promptPayPayload(PROMPTPAY_ID, PLAN.price);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setStep("plan");
      }}
    >
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-md">
        {step === "plan" ? (
          <>
            <DialogHeader>
              <DialogTitle>อัปเกรดเป็นแพ็กเกจเสียเงิน</DialogTitle>
              <DialogDescription>
                ปลดล็อกธีมพิเศษและฟีเจอร์เพิ่มเติม งานและประวัติในเบราว์เซอร์นี้ยังอยู่ครบ
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-baseline justify-between gap-2">
                <span className="flex items-center gap-2 font-medium">
                  <Crown className="size-4 text-signal" /> {PLAN.name}
                </span>
                <span>
                  <span className="font-mono text-2xl font-semibold">{baht(PLAN.price)}</span>
                  <span className="text-sm text-muted-foreground"> / {PLAN.period}</span>
                </span>
              </div>
              <ul className="mt-3 space-y-1.5 text-sm">
                {PERKS.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <Check className="size-4 text-success" /> {p}
                  </li>
                ))}
              </ul>
            </div>

            <DialogFooter className="gap-2 sm:flex-col sm:space-x-0">
              <Button
                size="lg"
                className="w-full bg-signal text-signal-foreground hover:bg-signal/90"
                onClick={() => setStep("pay")}
              >
                อัปเกรด
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
                ไว้ทีหลัง
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>สแกนชำระเงินผ่านพร้อมเพย์</DialogTitle>
              <DialogDescription>
                เปิดแอปธนาคารแล้วสแกน QR ด้านล่าง ยอด {baht(PLAN.price)} จะถูกกรอกให้อัตโนมัติ
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center gap-3">
              <div className="relative rounded-xl border border-border bg-card p-4 text-foreground">
                <QRCodeSVG
                  value={qrValue}
                  size={196}
                  level="M"
                  bgColor="transparent"
                  fgColor="currentColor"
                  className={cn(sample && "opacity-30 blur-[1.5px]")}
                  aria-label={sample ? "QR ตัวอย่าง สแกนจ่ายไม่ได้" : "QR พร้อมเพย์สำหรับชำระเงิน"}
                />
                {sample && (
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="-rotate-12 rounded-md border-2 border-destructive bg-card px-3 py-1 text-lg font-semibold text-destructive">
                      ตัวอย่าง
                    </span>
                  </span>
                )}
              </div>
              <div className="text-center">
                <p className="font-mono text-xl font-semibold">{baht(PLAN.price)}</p>
                <p className="text-xs text-muted-foreground">
                  {PLAN.name} · {PLAN.period}ละครั้ง
                </p>
              </div>
            </div>

            <p className="flex gap-2 rounded-lg bg-muted px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              {sample
                ? "QR นี้เป็นตัวอย่างเท่านั้น ยังสแกนจ่ายไม่ได้ จนกว่าจะตั้งค่าบัญชีพร้อมเพย์สำหรับรับเงิน"
                : "หลังโอนแล้ว กรุณาส่งสลิปให้ผู้ดูแลระบบเพื่อเปิดสิทธิ์ใช้งานต่อ ระบบจะไม่ปลดล็อกให้อัตโนมัติ"}
            </p>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep("plan")}>
                <ArrowLeft /> ย้อนกลับ
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
