"use client";

import { useState } from "react";

// Next Intl navigation — keeps the active locale on every link.
import { Link } from "@/i18n/navigation";

// ShadCn
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

// Components
import {
    BaseButton,
    LanguageSelector,
    TextSizeSelector,
    ThemeSwitcher,
} from "@/app/components";
import SectionNav from "./SectionNav";

// Contexts
import { useTranslationContext } from "@/contexts/TranslationContext";

// Icons
import { Archive, Camera, Settings2, Store } from "lucide-react";

const BaseNavbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);

    const { _t } = useTranslationContext();

    return (
        <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
            <nav className="container flex h-16 items-center justify-between gap-4">
                <Link
                    href="/"
                    className="flex shrink-0 items-center gap-2 font-semibold"
                >
                    <Camera className="h-5 w-5 text-primary" />
                    <span className="hidden text-base sm:inline sm:text-lg">
                        Studio Suite
                    </span>
                </Link>

                {/* The three sections. Always visible, including on mobile. */}
                <div className="min-w-0 flex-1">
                    <SectionNav />
                </div>

                {/* Desktop controls */}
                <div className="hidden items-center gap-2 sm:flex">
                    <BaseButton
                        asChild
                        variant="ghost"
                        size="sm"
                        tooltipLabel="All saved bookings, quotations and invoices"
                    >
                        <Link href="/records">
                            <Archive className="h-4 w-4" />
                            Records
                        </Link>
                    </BaseButton>

                    <BaseButton
                        asChild
                        variant="ghost"
                        size="sm"
                        tooltipLabel={_t("navbar.studioTooltip")}
                    >
                        <Link href="/studio">
                            <Store className="h-4 w-4" />
                            {_t("navbar.studio")}
                        </Link>
                    </BaseButton>
                    <TextSizeSelector />
                    <LanguageSelector />
                    <ThemeSwitcher />
                </div>

                {/*
                 * Below sm the language select alone is wider than the space
                 * left beside the logo, so both controls move into a sheet.
                 */}
                <div className="flex items-center gap-1 sm:hidden">
                    <ThemeSwitcher />
                    <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                        <SheetTrigger asChild>
                            <BaseButton
                                variant="ghost"
                                size="icon"
                                aria-label={_t("navbar.openSettings")}
                            >
                                <Settings2 className="h-5 w-5" />
                            </BaseButton>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[85vw] max-w-sm">
                            <SheetHeader className="mb-6">
                                <SheetTitle>
                                    {_t("navbar.settings")}
                                </SheetTitle>
                            </SheetHeader>

                            <div className="flex flex-col gap-4">
                                <BaseButton
                                    asChild
                                    variant="outline"
                                    className="justify-start"
                                >
                                    <Link
                                        href="/records"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        <Archive className="h-4 w-4" />
                                        Records
                                    </Link>
                                </BaseButton>

                                <BaseButton
                                    asChild
                                    variant="outline"
                                    className="justify-start"
                                >
                                    <Link
                                        href="/studio"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        <Store className="h-4 w-4" />
                                        {_t("navbar.studio")}
                                    </Link>
                                </BaseButton>

                                <div className="flex flex-col gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        {_t("settings.textSize.label")}
                                    </span>
                                    <TextSizeSelector variant="block" />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <span className="text-sm text-muted-foreground">
                                        {_t("navbar.language")}
                                    </span>
                                    <LanguageSelector variant="block" />
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </nav>
        </header>
    );
};

export default BaseNavbar;
