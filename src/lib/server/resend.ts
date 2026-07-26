import { Resend } from "resend";
import { RESEND_API_KEY } from "$env/static/private";

const resend = new Resend(RESEND_API_KEY);

// TODO: replace with a verified sending domain address before shipping to
// SEE: https://resend.com/docs/dashboard/domains/introduction
const FROM_ADDRESS = "Omnilog <onboarding@resend.dev>";

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
	const { error } = await resend.emails.send({
		from: FROM_ADDRESS,
		to,
		subject: "Reset your Omnilog password",
		html: `
			<p>Someone requested a password reset for this email's Omnilog account.</p>
			<p><a href="${resetUrl}">Click here to set a new password</a> — this link expires in 1 hour.</p>
			<p>If you didn't request this, you can safely ignore this email.</p>
		`,
	});

	if (error) {
		throw new Error(`Failed to send password reset email: ${error.message}`);
	}
}

export async function sendVerificationEmail(to: string, verifyUrl: string): Promise<void> {
	const { error } = await resend.emails.send({
		from: FROM_ADDRESS,
		to,
		subject: "Verify your Omnilog email",
		html: `
			<p>Confirm this is your email address to finish setting up your Omnilog account.</p>
			<p><a href="${verifyUrl}">Click here to verify your email</a> — this link expires in 1 hour.</p>
			<p>If you didn't create an Omnilog account, you can safely ignore this email.</p>
		`,
	});

	if (error) {
		throw new Error(`Failed to send verification email: ${error.message}`);
	}
}
