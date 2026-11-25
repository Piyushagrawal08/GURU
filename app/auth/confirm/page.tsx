import ConfirmResetForm from "./ConfirmResetForm";

type Params = { [key: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/**
 * The password-reset email links here. Nothing is verified on page load, so
 * email security scanners that pre-open links can't use up the token; the
 * user has to click the button.
 */
export default async function ConfirmPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  return (
    <ConfirmResetForm
      tokenHash={one(sp.token_hash)}
      code={one(sp.code)}
      linkError={one(sp.error_description)}
    />
  );
}
