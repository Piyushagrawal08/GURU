import ForgotPasswordForm from "./ForgotPasswordForm";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { expired } = await searchParams;
  return <ForgotPasswordForm expired={expired === "1"} />;
}
