import TemplateFrame, {
    templateCtx,
    type TemplateProps,
} from "../TemplateFrame";
import {
    ClientBlock,
    DocumentMeta,
    DocumentTitle,
    Logo,
    OccasionBanner,
    recipientLabelOf,
    StudioBlock,
} from "../parts";

/**
 * Classic — logo and studio on the left, title and meta on the right.
 *
 * The safe default. Reads as a business document, prints cleanly in black and
 * white, and leaves the accent colour doing only the work it needs to.
 */
export default function Classic(props: TemplateProps) {
    const ctx = templateCtx(props);
    const { data, labels, theme, scale } = ctx;

    return (
        <TemplateFrame ctx={ctx}>
            <header className="flex items-start justify-between gap-6">
                <div>
                    <Logo ctx={ctx} />
                    <p
                        className={`${scale.name} mt-2 font-semibold`}
                        style={{ color: theme.accentColor }}
                    >
                        {data.studio.brandName}
                    </p>
                    {data.studio.tagline && (
                        <p className={`${scale.label} text-gray-500`}>
                            {data.studio.tagline}
                        </p>
                    )}
                </div>

                <div>
                    <DocumentTitle ctx={ctx} align="right" />
                    <div className="mt-1.5">
                        <DocumentMeta ctx={ctx} align="right" />
                    </div>
                </div>
            </header>

            <div
                className={`${scale.sectionGap} border-t-2 pt-4`}
                style={{ borderColor: theme.accentColor }}
            >
                <div className="grid gap-6 sm:grid-cols-2">
                    <StudioBlock ctx={ctx} heading={labels.from} />
                    <ClientBlock
                        ctx={ctx}
                        heading={recipientLabelOf(ctx.d, labels)}
                        align="right"
                    />
                </div>
            </div>

            {data.details.occasion && (
                <div className="mt-4">
                    <OccasionBanner ctx={ctx} />
                </div>
            )}

            {props.renderBody(ctx)}
        </TemplateFrame>
    );
}
