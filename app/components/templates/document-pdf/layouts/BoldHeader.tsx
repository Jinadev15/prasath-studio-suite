import TemplateFrame, {
    templateCtx,
    type TemplateProps,
} from "../TemplateFrame";
import {
    ClientBlock,
    defaultTitleOf,
    documentNumberOf,
    DocumentMeta,
    Logo,
    OccasionBanner,
    recipientLabelOf,
    StudioBlock,
} from "../parts";
import { readableOn } from "../documentTheme";

/**
 * Bold Header — full-bleed colour band across the top.
 *
 * The one that looks like a modern candid studio's branding. The band is
 * edge-to-edge, which is why the frame is rendered `bare` and the padding is
 * applied per-section instead.
 */
export default function BoldHeader(props: TemplateProps) {
    const ctx = templateCtx(props);
    const { data, labels, theme, scale } = ctx;
    const onAccent = readableOn(theme.accentColor);

    return (
        <TemplateFrame ctx={ctx} bare>
            <header
                className="px-6 py-6 sm:px-10"
                style={{ backgroundColor: theme.accentColor, color: onAccent }}
            >
                <div className="flex items-start justify-between gap-6">
                    <div>
                        {/* A plate, because a studio's logo is an arbitrary
                            image and no filter makes an arbitrary image
                            legible on an arbitrary dark colour. */}
                        <Logo ctx={ctx} plate />
                        <p className={`${scale.name} mt-2 font-semibold`}>
                            {data.studio.brandName}
                        </p>
                        {data.studio.tagline && (
                            <p className={`${scale.label} opacity-80`}>
                                {data.studio.tagline}
                            </p>
                        )}
                    </div>

                    <div className="text-end">
                        <div
                            className={`${scale.heading} font-semibold uppercase tracking-tight`}
                        >
                            {ctx.d.documentTitle || defaultTitleOf(ctx.d, labels)}
                        </div>
                        <p className={`${scale.body} mt-0.5 tabular-nums opacity-90`}>
                            {documentNumberOf(ctx.d)}
                        </p>
                    </div>
                </div>
            </header>

            <div className={`flex flex-1 flex-col ${scale.page}`}>
                <div className="grid gap-6 sm:grid-cols-[1fr_auto]">
                    <div className="grid gap-6 sm:grid-cols-2">
                        <StudioBlock ctx={ctx} heading={labels.from} />
                        <ClientBlock ctx={ctx} heading={recipientLabelOf(ctx.d, labels)} />
                    </div>
                    <DocumentMeta ctx={ctx} align="right" />
                </div>

                {data.details.occasion && (
                    <div className="mt-4">
                        <OccasionBanner ctx={ctx} />
                    </div>
                )}

                {props.renderBody(ctx, { itemsVariant: "filled", totalsEmphasis: "fill" })}
            </div>
        </TemplateFrame>
    );
}
