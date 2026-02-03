import { sendSystemEmail } from "@/lib/email/system-mailer";

/**
 * Send contract end reminder email
 * @param {Object} options - Email options
 * @param {string} options.recipientEmail - Recipient email address
 * @param {string} options.recipientName - Recipient name
 * @param {string} options.contractNumber - Contract number
 * @param {string} options.contractId - Contract ID
 * @param {string} options.endDate - Contract end date (formatted)
 * @param {number} options.daysRemaining - Days until contract ends
 * @param {string} [options.vendorName] - Vendor name (optional)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendContractReminderEmail({
	recipientEmail,
	recipientName,
	contractNumber,
	contractId,
	endDate,
	daysRemaining,
	vendorName = "-",
}) {
	try {
		// Prepare email content
		const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
		const contractUrl = `${appUrl}/kontrak/${contractId}`;

		const subject = `🔔 Pengingat: Kontrak ${contractNumber} akan berakhir dalam ${daysRemaining} hari`;

		const text = `
Halo ${recipientName},

Kontrak ${contractNumber} akan berakhir pada ${endDate} (${daysRemaining} hari lagi).

Vendor: ${vendorName}

Harap segera melakukan pengecekan dan tindak lanjut yang diperlukan.

Lihat detail kontrak: ${contractUrl}

Terima kasih.
		`.trim();

		// Logo URL hosted on Cloudinary (reliable loading across all email clients)
		const logoURL = 'https://res.cloudinary.com/dyowppfu2/image/upload/v1769587580/Frame_77-Photoroom_qfryy2.png';

		const html = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<style>
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
			line-height: 1.6;
			color: #333;
			margin: 0;
			padding: 0;
			background-color: #f4f4f5;
		}
		.container {
			max-width: 600px;
			margin: 20px auto;
			background-color: #ffffff;
			border-radius: 8px;
			overflow: hidden;
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		}
		.header {
			background-color: #1e3a8a;
			padding: 40px 30px;
			text-align: center;
			color: white;
		}
		.logo-container {
			background: rgba(255, 255, 255, 0.95);
			padding: 20px;
			border-radius: 10px;
			margin-bottom: 20px;
			display: inline-block;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		}
		.logo-container img {
			height: 60px;
			width: auto;
			display: block;
		}
		.header-title {
			color: #ffffff;
			font-size: 24px;
			font-weight: 700;
			margin: 15px 0 8px 0;
			text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		}
		.header-subtitle {
			color: #e0e7ff;
			font-size: 14px;
			font-weight: 500;
			letter-spacing: 0.5px;
		}
		.content {
			padding: 30px 20px;
		}
		.greeting {
			font-size: 16px;
			margin-bottom: 20px;
		}
		.alert-box {
			background-color: #fef3c7;
			border-left: 4px solid #f59e0b;
			padding: 15px;
			margin: 20px 0;
			border-radius: 4px;
		}
		.alert-box .icon {
			font-size: 24px;
			margin-right: 10px;
		}
		.contract-info {
			background-color: #f9fafb;
			border-radius: 6px;
			padding: 20px;
			margin: 20px 0;
		}
		.info-row {
			display: flex;
			justify-content: space-between;
			padding: 8px 0;
			border-bottom: 1px solid #e5e7eb;
		}
		.info-row:last-child {
			border-bottom: none;
		}
		.info-label {
			font-weight: 600;
			color: #6b7280;
		}
		.info-value {
			color: #111827;
		}
		.countdown {
			text-align: center;
			padding: 20px;
			margin: 20px 0;
			background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
			color: white;
			border-radius: 8px;
		}
		.countdown-number {
			font-size: 48px;
			font-weight: bold;
			margin: 10px 0;
		}
		.countdown-label {
			font-size: 14px;
			text-transform: uppercase;
			letter-spacing: 1px;
		}
		.cta-button {
			display: inline-block;
			background-color: #2563eb;
			color: white;
			text-decoration: none;
			padding: 12px 30px;
			border-radius: 6px;
			margin: 20px 0;
			font-weight: 500;
			text-align: center;
		}
		.cta-button:hover {
			background-color: #1d4ed8;
		}
		.footer {
			background-color: #f9fafb;
			padding: 20px;
			text-align: center;
			font-size: 12px;
			color: #6b7280;
			border-top: 1px solid #e5e7eb;
		}
		.footer p {
			margin: 5px 0;
		}
	</style>
</head>
<body>
	<div class="container">
		<!-- Header with Logo -->
		<div class="header" style="background-color: #1e3a8a; padding: 40px 30px; text-align: center;">
			<div class="logo-container" style="background: rgba(255, 255, 255, 0.95); padding: 20px; border-radius: 10px; margin-bottom: 20px; display: inline-block; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
				<img src="${logoURL}" alt="Logo Kementerian Perhubungan - Biro Umum" style="height: 60px; width: auto; display: block;" />
			</div>
			<h1 class="header-title" style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">Pengingat Kontrak</h1>
			<p class="header-subtitle" style="margin: 8px 0 0 0; color: #dbeafe; font-size: 14px;">Kementerian Perhubungan - Biro Umum</p>
		</div>

		<!-- Content -->
		<div class="content">
			<div class="greeting">
				Halo <strong>${recipientName}</strong>,
			</div>

			<!-- Alert Box -->
			<div class="alert-box">
				<span class="icon">⚠️</span>
				<strong>Perhatian!</strong> Kontrak berikut akan segera berakhir dan memerlukan perhatian Anda.
			</div>

			<!-- Countdown Timer -->
			<div class="countdown">
				<div class="countdown-number">${daysRemaining}</div>
				<div class="countdown-label">Hari Tersisa</div>
			</div>

			<!-- Contract Information -->
			<div class="contract-info">
				<div class="info-row">
					<span class="info-label">Nomor Kontrak:</span>
					<span class="info-value"><strong>${contractNumber}</strong></span>
				</div>
				<div class="info-row">
					<span class="info-label">Vendor:</span>
					<span class="info-value">${vendorName}</span>
				</div>
				<div class="info-row">
					<span class="info-label">Tanggal Berakhir:</span>
					<span class="info-value"><strong>${endDate}</strong></span>
				</div>
			</div>

			<!-- CTA Button -->
			<div style="text-align: center;">
				<a href="${contractUrl}" class="cta-button">
					📄 Lihat Detail Kontrak
				</a>
			</div>

			<p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
				Harap segera melakukan pengecekan dan tindak lanjut yang diperlukan untuk kontrak ini.
				Jika diperlukan perpanjangan atau proses pengadaan baru, segera koordinasikan dengan tim terkait.
			</p>
		</div>

		<!-- Footer -->
		<div class="footer">
			<p><strong>Sistem Procurement Kementerian Perhubungan</strong></p>
			<p>Email ini dikirim secara otomatis oleh sistem. Mohon tidak membalas email ini.</p>
			<p>© ${new Date().getFullYear()} Kementerian Perhubungan RI - Biro Umum</p>
		</div>
	</div>
</body>
</html>
		`.trim();

		// Send email using system mailer (with automatic fallback)
		const result = await sendSystemEmail({
			to: recipientEmail,
			subject: subject,
			text: text,
			html: html,
		});

		if (result.success) {
			console.log(`✅ Contract reminder email sent to: ${recipientEmail} ${result.usedFallback ? '(fallback)' : '(system)'}`);
		}

		return result;
	} catch (error) {
		console.error("❌ Error sending contract reminder email:", error);
		return {
			success: false,
			error: error.message,
		};
	}
}
