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
 * Letterhead — centred masthead, formal and symmetrical.
 *
 * The layout a traditional studio will recognise: it looks like the printed
 * letterhead pad it is replacing, which matters when the document is being
 * handed across a table to an elder rather than opened on a phone.
 */
export default function Letterhead(props: TemplateProps) {
    const ctx = templateCtx(props);
    const { data, labels, theme, scale } = ctx;
    const studio = data.studio;

    return (
        <TemplateFrame ctx={ctx}>
            <header className="text-center">
                {studio.logo && (
                    <div className="flex justify-center">
                        <Logo ctx={ctx} size={72} />
                    </div>
                )}

                <p
                    className={`${scale.heading} mt-2 font-semibold tracking-tight`}
                    style={{ color: theme.accentColor }}
                >
                    {studio.brandName}
                </p>
                {studio.tagline && (
                    <p className={`${scale.body} text-gray-500`}>
                        {studio.tagline}
                    </p>
                )}

                <p className={`${scale.label} mt-1 text-gray-600`}>
                    {[
                        studio.addressLine1,
                        studio.addressLine2,
                        [studio.city, studio.state, studio.pincode]
                            .filter(Boolean)
                            .join(" "),
                    ]
                        .filter(Boolean)
                        .join(", ")}
                </p>
                <p className={`${scale.label} text-gray-600`}>
                    {[studio.phone, studio.email, studio.website]
                        .filter(Boolean)
                        .join(" · ")}
                </p>
                {studio.gstin && (
                    <p className={`${scale.label} tabular-nums text-gray-600`}>
                        {labels.gstin}: {studio.gstin}
                    </p>
                )}

                <div
                    className="mt-3 border-t-2"
                    style={{ borderColor: theme.accentColor }}
                />
            </header>

            <div className="mt-4 flex items-start justify-between gap-6">
                <DocumentTitle ctx={ctx} align="left" />
                <DocumentMeta ctx={ctx} align="right" />
            </div>

            <div className={`${scale.sectionGap} grid gap-6 sm:grid-cols-2`}>
                <ClientBlock ctx={ctx} heading={recipientLabelOf(ctx.d, labels)} />
                {/* The masthead already carries the studio, so this side is
                    only the statutory detail the header leaves out. */}
                <div className="text-end">
                    <StudioBlock
                        ctx={ctx}
                        heading={labels.from}
                        align="right"
                        showStatutory={false}
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
