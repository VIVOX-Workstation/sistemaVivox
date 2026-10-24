import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, Check, Eye, EyeOff, Lock, Mail } from 'lucide-react';

interface LoginVivoxProps {
  onSubmit: (data: { email: string; senha: string; lembrar: boolean }) => void | Promise<void>;
  /** Pedido de nova senha: a tela envia o e-mail e a mensagem para o suporte. */
  onForgotPassword?: (data: { email: string; mensagem: string }) => void | Promise<void>;
  onGoogleSignIn?: () => void;
  loading?: boolean;
  error?: string | null;
  defaultEmail?: string;
  onSupportClick?: () => void;
}

type View = 'login' | 'forgot' | 'sent';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMAIL_HINT = 'Confira o e-mail. Exemplo: nome@vivoxmarketing.com.br';

/** Logo "G" do Google em SVG, sem depender de um ícone genérico. */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
      <path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z" />
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
    </svg>
  );
}

/** Logo "Sistema VIVOX": a palavra SISTEMA em dourado e o VIVOX com o V em dourado. */
function VivoxLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1022 117" role="img" aria-label="Sistema VIVOX">
      <path d="M26.7136 54.2807L26.8221 54.3078C29.8324 54.5248 32.3818 54.7689 34.47 55.0672C36.5583 55.3655 38.5923 55.7994 40.545 56.3418C42.4977 56.8843 44.0707 57.5623 45.2368 58.3759C46.403 59.1895 47.3251 60.2201 48.0031 61.4947C48.6811 62.7694 49.0337 64.2881 49.0337 66.0509C49.0337 70.0105 47.1081 73.0751 43.2571 75.2448C39.406 77.4144 33.792 78.4992 26.3882 78.4992C22.293 78.4992 17.9808 78.1195 13.4517 77.333C8.92261 76.5465 5.20712 75.5973 2.30523 74.4583V67.0815C5.01728 68.3562 8.54293 69.4952 12.8822 70.4987C17.2215 71.5022 21.398 71.9903 25.3847 71.9903C34.9582 71.9903 39.7585 70.2817 39.7585 66.8646C39.7585 65.1289 38.6466 63.9084 36.3956 63.2033C34.1446 62.4982 30.2935 61.9558 24.8423 61.549C22.4286 61.3591 20.4217 61.1693 18.8216 61.0066C17.2215 60.8438 15.4858 60.5726 13.5873 60.2201C11.6889 59.8675 10.143 59.4336 8.94973 58.9183C7.75644 58.403 6.6445 57.7521 5.5868 56.9656C4.52911 56.1791 3.74262 55.2028 3.25445 54.0637C2.76628 52.9247 2.5222 51.5958 2.5222 50.077C2.5222 42.3748 10.143 38.5237 25.4118 38.5237C29.7511 38.5237 33.8734 38.9034 37.7516 39.6357C41.6298 40.3679 44.2876 41.0459 45.725 41.6426V48.6939C43.8808 47.9074 41.0874 47.0938 37.3448 46.2531C33.6022 45.4123 29.6426 45.0055 25.4389 45.0055C16.435 45.0055 11.933 46.5243 11.933 49.5346C11.933 51.2703 13.4788 52.4907 16.5977 53.1688C18.3063 53.5484 21.6692 53.9281 26.7136 54.2807ZM76.0402 77.9297V39.039H85.1527V77.9297H76.0402ZM136.812 54.2807L136.92 54.3078C139.93 54.5248 142.48 54.7689 144.568 55.0672C146.656 55.3655 148.69 55.7994 150.643 56.3418C152.596 56.8843 154.169 57.5623 155.335 58.3759C156.501 59.1895 157.423 60.2201 158.101 61.4947C158.779 62.7694 159.132 64.2881 159.132 66.0509C159.132 70.0105 157.206 73.0751 153.355 75.2448C149.504 77.4144 143.89 78.4992 136.486 78.4992C132.391 78.4992 128.079 78.1195 123.55 77.333C119.021 76.5465 115.305 75.5973 112.403 74.4583V67.0815C115.115 68.3562 118.641 69.4952 122.98 70.4987C127.319 71.5022 131.496 71.9903 135.483 71.9903C145.056 71.9903 149.857 70.2817 149.857 66.8646C149.857 65.1289 148.745 63.9084 146.494 63.2033C144.243 62.4982 140.392 61.9558 134.94 61.549C132.527 61.3591 130.52 61.1693 128.92 61.0066C127.319 60.8438 125.584 60.5726 123.685 60.2201C121.787 59.8675 120.241 59.4336 119.048 58.9183C117.854 58.403 116.743 57.7521 115.685 56.9656C114.627 56.1791 113.841 55.2028 113.352 54.0637C112.864 52.9247 112.62 51.5958 112.62 50.077C112.62 42.3748 120.241 38.5237 135.51 38.5237C139.849 38.5237 143.971 38.9034 147.85 39.6357C151.728 40.3679 154.386 41.0459 155.823 41.6426V48.6939C153.979 47.9074 151.185 47.0938 147.443 46.2531C143.7 45.4123 139.741 45.0055 135.537 45.0055C126.533 45.0055 122.031 46.5243 122.031 49.5346C122.031 51.2703 123.577 52.4907 126.696 53.1688C128.404 53.5484 131.767 53.9281 136.812 54.2807ZM181.419 45.4937V39.039H225.354V45.4937H207.916V77.9297H198.803V45.4937H181.419ZM295.564 71.475V77.9297H251.086V39.039H294.506V45.4937H260.199V55.5011H290.411V61.2778H260.199V71.475H295.564ZM367.834 39.039H380.011V77.9297H371.007V50.2126H370.736L355.576 77.9297H347.575L332.361 50.2126H332.089V77.9297H323.085V39.039H335.29L351.399 68.7087H351.67L367.834 39.039ZM437.637 39.039L457.028 77.9297H447.264L443.413 70.2546H419.14L415.316 77.9297H405.553L424.917 39.039H437.637ZM421.88 64.2068H440.701L431.426 45.6564H431.155L421.88 64.2068Z" fill="url(#vsx0)"/><path d="M503.61 65.2316C506.021 65.0479 508.126 66.85 508.316 69.2603C508.505 71.671 506.708 73.7799 504.298 73.9758C501.88 74.1721 499.762 72.3676 499.571 69.9489C499.381 67.5299 501.191 65.4161 503.61 65.2316Z" fill="#FFECCD"/><g opacity={0.5}><path d="M503.259 58.2334C503.648 58.2131 504.137 58.2154 504.527 58.2311C507.415 58.3397 510.205 59.3057 512.543 61.0059C513.578 61.7465 515.021 62.7883 514.938 64.1977C514.898 64.7881 514.621 65.3371 514.169 65.7193C513.852 65.9943 513.461 66.1697 513.045 66.2237C511.798 66.3906 511.212 65.564 510.356 64.8534C508.706 63.4844 506.761 62.798 504.646 62.6273C502.059 62.3789 499.124 63.3785 497.215 65.1273C496.641 65.6534 496.136 66.1689 495.316 66.2393C494.73 66.2878 494.149 66.0975 493.706 65.7117C493.269 65.3429 492.998 64.8147 492.953 64.2448C492.85 62.8045 494.184 61.8804 495.213 61.1002C497.566 59.3164 500.323 58.4133 503.259 58.2334Z" fill="#FFECCD"/><path d="M503.259 58.2334C503.648 58.2131 504.137 58.2154 504.527 58.2311C507.415 58.3397 510.205 59.3057 512.543 61.0059C513.578 61.7465 515.021 62.7883 514.938 64.1977C514.898 64.7881 514.621 65.3371 514.169 65.7193C513.852 65.9943 513.461 66.1697 513.045 66.2237C511.798 66.3906 511.212 65.564 510.356 64.8534C508.706 63.4844 506.761 62.798 504.646 62.6273C502.059 62.3789 499.124 63.3785 497.215 65.1273C496.641 65.6534 496.136 66.1689 495.316 66.2393C494.73 66.2878 494.149 66.0975 493.706 65.7117C493.269 65.3429 492.998 64.8147 492.953 64.2448C492.85 62.8045 494.184 61.8804 495.213 61.1002C497.566 59.3164 500.323 58.4133 503.259 58.2334Z" fill="url(#vsx1)"/><path d="M503.259 58.2334C503.648 58.2131 504.137 58.2154 504.527 58.2311C507.415 58.3397 510.205 59.3057 512.543 61.0059C513.578 61.7465 515.021 62.7883 514.938 64.1977C514.898 64.7881 514.621 65.3371 514.169 65.7193C513.852 65.9943 513.461 66.1697 513.045 66.2237C511.798 66.3906 511.212 65.564 510.356 64.8534C508.706 63.4844 506.761 62.798 504.646 62.6273C502.059 62.3789 499.124 63.3785 497.215 65.1273C496.641 65.6534 496.136 66.1689 495.316 66.2393C494.73 66.2878 494.149 66.0975 493.706 65.7117C493.269 65.3429 492.998 64.8147 492.953 64.2448C492.85 62.8045 494.184 61.8804 495.213 61.1002C497.566 59.3164 500.323 58.4133 503.259 58.2334Z" fill="url(#vsx2)"/></g><g opacity={0.8}><path d="M503.298 50.2259C503.752 50.2155 504.206 50.2164 504.66 50.2289C509.374 50.3655 513.937 51.9267 517.747 54.7068C518.719 55.4067 519.626 56.1709 520.471 57.0206C521.374 57.9292 521.4 59.3785 520.428 60.2527C519.825 60.7975 518.968 60.9594 518.208 60.6723C517.546 60.417 516.522 59.2797 515.847 58.7527C512.448 56.0983 508.955 54.8537 504.688 54.6047C499.43 54.5232 494.616 56.1668 490.788 59.8692C490.562 60.0871 490.287 60.346 490.02 60.507C489.224 60.9884 488.191 60.8769 487.487 60.2765C487.044 59.9033 486.773 59.3639 486.739 58.785C486.677 57.8407 487.149 57.2468 487.804 56.6346C488.571 55.917 489.366 55.2563 490.221 54.6444C493.503 52.2728 497.346 50.7955 501.371 50.3577C501.98 50.2886 502.681 50.261 503.298 50.2259Z" fill="#FFECCD"/><path d="M503.298 50.2259C503.752 50.2155 504.206 50.2164 504.66 50.2289C509.374 50.3655 513.937 51.9267 517.747 54.7068C518.719 55.4067 519.626 56.1709 520.471 57.0206C521.374 57.9292 521.4 59.3785 520.428 60.2527C519.825 60.7975 518.968 60.9594 518.208 60.6723C517.546 60.417 516.522 59.2797 515.847 58.7527C512.448 56.0983 508.955 54.8537 504.688 54.6047C499.43 54.5232 494.616 56.1668 490.788 59.8692C490.562 60.0871 490.287 60.346 490.02 60.507C489.224 60.9884 488.191 60.8769 487.487 60.2765C487.044 59.9033 486.773 59.3639 486.739 58.785C486.677 57.8407 487.149 57.2468 487.804 56.6346C488.571 55.917 489.366 55.2563 490.221 54.6444C493.503 52.2728 497.346 50.7955 501.371 50.3577C501.98 50.2886 502.681 50.261 503.298 50.2259Z" fill="url(#vsx3)"/><path d="M503.298 50.2259C503.752 50.2155 504.206 50.2164 504.66 50.2289C509.374 50.3655 513.937 51.9267 517.747 54.7068C518.719 55.4067 519.626 56.1709 520.471 57.0206C521.374 57.9292 521.4 59.3785 520.428 60.2527C519.825 60.7975 518.968 60.9594 518.208 60.6723C517.546 60.417 516.522 59.2797 515.847 58.7527C512.448 56.0983 508.955 54.8537 504.688 54.6047C499.43 54.5232 494.616 56.1668 490.788 59.8692C490.562 60.0871 490.287 60.346 490.02 60.507C489.224 60.9884 488.191 60.8769 487.487 60.2765C487.044 59.9033 486.773 59.3639 486.739 58.785C486.677 57.8407 487.149 57.2468 487.804 56.6346C488.571 55.917 489.366 55.2563 490.221 54.6444C493.503 52.2728 497.346 50.7955 501.371 50.3577C501.98 50.2886 502.681 50.261 503.298 50.2259Z" fill="url(#vsx4)"/></g><path d="M503.159 42.8812C503.566 42.8651 504.088 42.8714 504.496 42.8786C511.496 42.9928 518.268 45.3833 523.788 49.6885C524.763 50.4513 525.733 51.3006 526.615 52.1709C527.101 52.6499 527.392 53.2143 527.37 53.9125C527.356 54.5005 527.104 55.0577 526.671 55.4565C526.131 55.9577 525.375 56.1525 524.66 55.9744C523.917 55.7915 523.368 55.1252 522.822 54.6139C522.365 54.1929 521.896 53.7858 521.415 53.3933C516.561 49.4706 511.006 47.5514 504.816 47.2647C499.869 47.1065 494.968 48.2664 490.616 50.6256C488.913 51.5519 487.314 52.6562 485.844 53.9201C485.643 54.0928 485.451 54.2746 485.25 54.4457C484.468 55.1122 483.932 55.9787 482.818 56.0404C482.242 56.0734 481.678 55.8718 481.253 55.4816C480.231 54.5326 480.29 53.1613 481.246 52.1974C482.162 51.275 483.134 50.4396 484.158 49.6405C489.606 45.4139 496.266 43.0449 503.159 42.8812Z" fill="#FFECCD"/><path d="M503.159 42.8812C503.566 42.8651 504.088 42.8714 504.496 42.8786C511.496 42.9928 518.268 45.3833 523.788 49.6885C524.763 50.4513 525.733 51.3006 526.615 52.1709C527.101 52.6499 527.392 53.2143 527.37 53.9125C527.356 54.5005 527.104 55.0577 526.671 55.4565C526.131 55.9577 525.375 56.1525 524.66 55.9744C523.917 55.7915 523.368 55.1252 522.822 54.6139C522.365 54.1929 521.896 53.7858 521.415 53.3933C516.561 49.4706 511.006 47.5514 504.816 47.2647C499.869 47.1065 494.968 48.2664 490.616 50.6256C488.913 51.5519 487.314 52.6562 485.844 53.9201C485.643 54.0928 485.451 54.2746 485.25 54.4457C484.468 55.1122 483.932 55.9787 482.818 56.0404C482.242 56.0734 481.678 55.8718 481.253 55.4816C480.231 54.5326 480.29 53.1613 481.246 52.1974C482.162 51.275 483.134 50.4396 484.158 49.6405C489.606 45.4139 496.266 43.0449 503.159 42.8812Z" fill="url(#vsx5)"/><path d="M503.159 42.8812C503.566 42.8651 504.088 42.8714 504.496 42.8786C511.496 42.9928 518.268 45.3833 523.788 49.6885C524.763 50.4513 525.733 51.3006 526.615 52.1709C527.101 52.6499 527.392 53.2143 527.37 53.9125C527.356 54.5005 527.104 55.0577 526.671 55.4565C526.131 55.9577 525.375 56.1525 524.66 55.9744C523.917 55.7915 523.368 55.1252 522.822 54.6139C522.365 54.1929 521.896 53.7858 521.415 53.3933C516.561 49.4706 511.006 47.5514 504.816 47.2647C499.869 47.1065 494.968 48.2664 490.616 50.6256C488.913 51.5519 487.314 52.6562 485.844 53.9201C485.643 54.0928 485.451 54.2746 485.25 54.4457C484.468 55.1122 483.932 55.9787 482.818 56.0404C482.242 56.0734 481.678 55.8718 481.253 55.4816C480.231 54.5326 480.29 53.1613 481.246 52.1974C482.162 51.275 483.134 50.4396 484.158 49.6405C489.606 45.4139 496.266 43.0449 503.159 42.8812Z" fill="url(#vsx6)"/><path d="M565.157 0H549.88L561.723 31.5406L562.155 29.9135C563.451 25.0251 565.841 20.5543 566.676 15.5579C567.518 10.4967 567.086 5.19796 565.301 0.403164L565.15 0H565.157Z" fill="url(#vsx7)"/><path d="M565.157 0H549.88L561.723 31.5406L562.155 29.9135C563.451 25.0251 565.841 20.5543 566.676 15.5579C567.518 10.4967 567.086 5.19796 565.301 0.403164L565.15 0H565.157Z" fill="url(#vsx8)"/><path d="M637.864 4.72407e-06L601.514 98.6245L573.746 23.2756L573.321 22.2101L572.759 23.2324C567.403 32.9012 566.575 44.4203 570.484 54.8306C578.253 75.5072 586.014 96.1839 593.774 116.861H609.253L653.141 4.72407e-06H637.864Z" fill="url(#vsx9)"/><path d="M637.864 4.72407e-06L601.514 98.6245L573.746 23.2756L573.321 22.2101L572.759 23.2324C567.403 32.9012 566.575 44.4203 570.484 54.8306C578.253 75.5072 586.014 96.1839 593.774 116.861H609.253L653.141 4.72407e-06H637.864Z" fill="url(#vsx10)"/><path d="M759.932 100.158L723.591 0.289062H709.438L752.918 116.066L753.016 116.326H766.354L810.094 0.289062H796.282L759.932 100.158Z" fill="currentColor"/><path d="M951.141 0L951.239 0.259766L979.697 47.0928L1008.16 0.259766L1008.25 0H1021.59L986.259 58.1699L1021.65 116.324H1008.31L1008.21 116.064L979.751 69.2314L951.293 116.064L951.194 116.324H937.857L973.188 58.2588L937.803 0H951.141Z" fill="currentColor"/><path d="M687.975 0.289062H675.22V116.326H687.975V0.289062Z" fill="currentColor"/><path d="M931.232 57.7766C931.232 89.6858 905.365 115.553 873.455 115.553C841.546 115.553 815.679 89.6858 815.679 57.7766C815.679 25.8675 841.546 0 873.455 0C905.365 0 931.232 25.8675 931.232 57.7766ZM828.048 57.7766C828.048 82.8546 848.377 103.184 873.455 103.184C898.533 103.184 918.863 82.8546 918.863 57.7766C918.863 32.6987 898.533 12.369 873.455 12.369C848.377 12.369 828.048 32.6987 828.048 57.7766Z" fill="currentColor"/><defs><linearGradient id="vsx0" x1="150.019" y1="45.138" x2="152.648" y2="94.4505" gradientUnits="userSpaceOnUse"><stop stopColor="#CCB691"/><stop offset="1" stopColor="#FFF0D8"/></linearGradient><linearGradient id="vsx1" x1="500.152" y1="59.4967" x2="502.362" y2="69.1711" gradientUnits="userSpaceOnUse"><stop stopColor="#CCB691"/><stop offset="1" stopColor="#876224"/></linearGradient><linearGradient id="vsx2" x1="500.152" y1="59.4967" x2="502.362" y2="69.1711" gradientUnits="userSpaceOnUse"><stop stopColor="#CCB691"/><stop offset="1" stopColor="#FFF0D8"/></linearGradient><linearGradient id="vsx3" x1="498.007" y1="51.9051" x2="500.503" y2="64.8568" gradientUnits="userSpaceOnUse"><stop stopColor="#CCB691"/><stop offset="1" stopColor="#876224"/></linearGradient><linearGradient id="vsx4" x1="498.007" y1="51.9051" x2="500.503" y2="64.8568" gradientUnits="userSpaceOnUse"><stop stopColor="#CCB691"/><stop offset="1" stopColor="#FFF0D8"/></linearGradient><linearGradient id="vsx5" x1="495.858" y1="44.968" x2="498.709" y2="61.1695" gradientUnits="userSpaceOnUse"><stop stopColor="#CCB691"/><stop offset="1" stopColor="#876224"/></linearGradient><linearGradient id="vsx6" x1="495.858" y1="44.968" x2="498.709" y2="61.1695" gradientUnits="userSpaceOnUse"><stop stopColor="#CCB691"/><stop offset="1" stopColor="#FFF0D8"/></linearGradient><linearGradient id="vsx7" x1="583.703" y1="18.6028" x2="653.604" y2="117.254" gradientUnits="userSpaceOnUse"><stop stopColor="#CCB691"/><stop offset="1" stopColor="#876224"/></linearGradient><linearGradient id="vsx8" x1="583.703" y1="18.6028" x2="653.604" y2="117.254" gradientUnits="userSpaceOnUse"><stop stopColor="#CCB691"/><stop offset="1" stopColor="#FFF0D8"/></linearGradient><linearGradient id="vsx9" x1="583.703" y1="18.6028" x2="653.604" y2="117.254" gradientUnits="userSpaceOnUse"><stop stopColor="#CCB691"/><stop offset="1" stopColor="#876224"/></linearGradient><linearGradient id="vsx10" x1="583.703" y1="18.6028" x2="653.604" y2="117.254" gradientUnits="userSpaceOnUse"><stop stopColor="#CCB691"/><stop offset="1" stopColor="#FFF0D8"/></linearGradient></defs>
    </svg>
  );
}

const CSS = `
.vlg{--vlg-ink:#080706;--vlg-card:rgba(19,17,14,.74);--vlg-field:#12100d;--vlg-line:rgba(204,182,145,.14);--vlg-line-strong:rgba(204,182,145,.34);
  --vlg-text:#f4efe6;--vlg-muted:#9b9386;--vlg-gold:#ccb691;--vlg-glow:204,182,145;--vlg-danger:#ff7a6b;
  position:fixed;inset:0;overflow:auto;background:var(--vlg-ink);color:var(--vlg-text);font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased}
.vlg *{box-sizing:border-box}
.vlg [hidden]{display:none!important}
.vlg-stage{position:relative;min-height:100%;display:grid;grid-template-columns:minmax(0,1fr);place-items:center;padding:40px 16px;isolation:isolate;overflow:hidden}
.vlg-grid{position:absolute;inset:0;z-index:-3;background-image:linear-gradient(to right,rgba(204,182,145,.07) 1px,transparent 1px),linear-gradient(to bottom,rgba(204,182,145,.07) 1px,transparent 1px);background-size:96px 96px;background-position:center top;-webkit-mask-image:radial-gradient(ellipse 70% 60% at 50% 38%,#000 10%,transparent 75%);mask-image:radial-gradient(ellipse 70% 60% at 50% 38%,#000 10%,transparent 75%)}
.vlg-dust{position:absolute;inset:0;z-index:-3;background-image:radial-gradient(rgba(204,182,145,.55) 1px,transparent 1.4px);background-size:54px 54px;opacity:.16;-webkit-mask-image:radial-gradient(ellipse 60% 50% at 50% 40%,#000 0%,transparent 80%);mask-image:radial-gradient(ellipse 60% 50% at 50% 40%,#000 0%,transparent 80%)}
.vlg-light{position:absolute;left:50%;top:42%;width:min(980px,140vw);aspect-ratio:1;z-index:-2;pointer-events:none;transform:translate(calc(-50% + var(--vlg-px,0px)),calc(-50% + var(--vlg-py,0px)))}
.vlg-light i{position:absolute;inset:0;border-radius:50%;background:radial-gradient(closest-side,rgba(var(--vlg-glow),.30),rgba(var(--vlg-glow),.10) 45%,transparent 72%);filter:blur(30px);animation:vlg-breathe 7s ease-in-out infinite}
.vlg-light i+i{inset:28%;background:radial-gradient(closest-side,rgba(255,226,170,.34),rgba(var(--vlg-glow),.08) 60%,transparent 75%);filter:blur(24px);animation-delay:-3.5s}
@keyframes vlg-breathe{0%,100%{opacity:.55;transform:scale(.92)}50%{opacity:1;transform:scale(1.06)}}
.vlg-vignette{position:absolute;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(ellipse 90% 80% at 50% 45%,transparent 40%,rgba(0,0,0,.72) 100%)}
.vlg-wrap{width:100%;min-width:0;max-width:400px;display:grid;gap:26px;justify-items:center}
.vlg-logo{display:block;width:min(340px,100%);height:auto;color:var(--vlg-text);filter:drop-shadow(0 0 22px rgba(var(--vlg-glow),.25))}
.vlg-top{position:absolute;top:0;left:0;right:0;display:flex;justify-content:flex-end;padding:16px 20px}
.vlg-card{position:relative;width:100%;padding:30px 28px 26px;border-radius:20px;background:var(--vlg-card);border:1px solid var(--vlg-line);-webkit-backdrop-filter:blur(18px) saturate(1.2);backdrop-filter:blur(18px) saturate(1.2);box-shadow:0 30px 80px -30px rgba(0,0,0,.9),0 0 0 1px rgba(0,0,0,.4),0 0 60px -20px rgba(var(--vlg-glow),.28);animation:vlg-rise .7s cubic-bezier(.2,.8,.2,1) both,vlg-halo 7s ease-in-out infinite}
.vlg-card::before{content:"";position:absolute;left:14%;right:14%;top:-1px;height:1px;background:linear-gradient(90deg,transparent,rgba(var(--vlg-glow),.9),transparent)}
@keyframes vlg-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes vlg-halo{0%,100%{box-shadow:0 30px 80px -30px rgba(0,0,0,.9),0 0 0 1px rgba(0,0,0,.4),0 0 40px -22px rgba(var(--vlg-glow),.18)}50%{box-shadow:0 30px 80px -30px rgba(0,0,0,.9),0 0 0 1px rgba(0,0,0,.4),0 0 70px -16px rgba(var(--vlg-glow),.38)}}
.vlg-pane{display:grid;gap:18px;animation:vlg-swap .35s cubic-bezier(.2,.8,.2,1) both}
@keyframes vlg-swap{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.vlg-head{text-align:center}.vlg-head .vlg-sub{margin:10px 0 0;text-wrap:balance}.vlg h1{margin:0;font-weight:600;font-size:22px;letter-spacing:-.01em;text-wrap:balance}
.vlg-sub{margin:-10px 0 0;color:var(--vlg-muted);font-size:13.5px}
.vlg form{display:grid;gap:16px}
.vlg-fld{display:grid;gap:7px}
.vlg-fld label{font-size:12px;font-weight:600;letter-spacing:.02em;color:var(--vlg-muted)}
.vlg-opt{font-weight:500;color:#6f685d}
.vlg-inp{position:relative;display:flex;align-items:center;height:46px;border-radius:12px;background:var(--vlg-field);border:1px solid var(--vlg-line);transition:border-color .2s,box-shadow .2s}
.vlg-inp:hover{border-color:var(--vlg-line-strong)}
.vlg-inp:focus-within{border-color:rgba(var(--vlg-glow),.75);box-shadow:0 0 0 4px rgba(var(--vlg-glow),.12)}
.vlg-inp.bad{border-color:rgba(255,122,107,.7);box-shadow:0 0 0 4px rgba(255,122,107,.1)}
.vlg-inp.area{height:auto;align-items:stretch}
.vlg-ic{width:17px;height:17px;flex:none;margin-left:14px;color:var(--vlg-muted);transition:color .2s}
.vlg-inp:focus-within .vlg-ic{color:var(--vlg-gold)}
.vlg-inp input,.vlg-inp textarea{flex:1;min-width:0;border:0;outline:0;background:transparent;color:var(--vlg-text);font:inherit;font-size:14.5px}
.vlg-inp input{height:100%;padding:0 14px 0 11px}
.vlg-inp textarea{padding:12px 14px;resize:none;line-height:1.45;font-size:14px}
.vlg-inp input::placeholder,.vlg-inp textarea::placeholder{color:#6c665c}
.vlg-inp input:disabled{opacity:.6}
.vlg-inp input:-webkit-autofill{-webkit-text-fill-color:var(--vlg-text);box-shadow:0 0 0 40px var(--vlg-field) inset;caret-color:var(--vlg-text)}
.vlg-eye{width:42px;height:100%;flex:none;display:grid;place-items:center;border:0;background:transparent;color:var(--vlg-muted);cursor:pointer;border-radius:0 12px 12px 0}
.vlg-eye:hover{color:var(--vlg-text)}
.vlg-err{margin:0;font-size:12px;color:var(--vlg-danger)}
.vlg-alert{padding:10px 12px;border-radius:10px;border:1px solid rgba(255,122,107,.4);background:rgba(255,122,107,.08);color:var(--vlg-danger);font-size:13px}
.vlg-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.vlg-chk{display:inline-flex;align-items:center;gap:9px;color:var(--vlg-muted);font-size:13px;cursor:pointer;user-select:none}
.vlg-chk input{position:absolute;opacity:0;width:1px;height:1px}
.vlg-box{width:18px;height:18px;border-radius:6px;border:1px solid var(--vlg-line-strong);background:var(--vlg-field);display:grid;place-items:center;transition:background .2s,border-color .2s}
.vlg-box svg{width:12px;height:12px;color:var(--vlg-ink);opacity:0;transform:scale(.6);transition:opacity .15s,transform .15s}
.vlg-chk input:checked+.vlg-box{background:var(--vlg-gold);border-color:var(--vlg-gold)}
.vlg-chk input:checked+.vlg-box svg{opacity:1;transform:none}
.vlg-chk input:focus-visible+.vlg-box{box-shadow:0 0 0 4px rgba(var(--vlg-glow),.2)}
.vlg-link{padding:0;border:0;background:none;color:var(--vlg-gold);font:inherit;font-size:13px;font-weight:600;cursor:pointer;border-radius:6px;text-decoration:underline;text-decoration-color:transparent;text-underline-offset:4px;transition:text-decoration-color .2s,color .2s}
.vlg-link:hover{color:#e6d3b0;text-decoration-color:currentColor}
.vlg-link:focus-visible,.vlg-eye:focus-visible,.vlg-btn:focus-visible,.vlg-ghost:focus-visible{outline:2px solid rgba(var(--vlg-glow),.8);outline-offset:3px}
.vlg-btn{position:relative;overflow:hidden;height:48px;border:0;border-radius:12px;cursor:pointer;background:linear-gradient(180deg,#dcc7a0,#b99a62);color:#14100a;font:inherit;font-size:14.5px;font-weight:700;letter-spacing:.01em;box-shadow:0 10px 30px -10px rgba(var(--vlg-glow),.55),inset 0 1px 0 rgba(255,255,255,.35);transition:transform .15s,box-shadow .25s,filter .2s;display:inline-flex;align-items:center;justify-content:center;gap:9px}
.vlg-btn::after{content:"";position:absolute;inset:0;transform:translateX(-120%);background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.45) 50%,transparent 70%);transition:transform .7s}
.vlg-btn:hover{filter:brightness(1.06);box-shadow:0 14px 38px -10px rgba(var(--vlg-glow),.7),inset 0 1px 0 rgba(255,255,255,.4)}
.vlg-btn:hover::after{transform:translateX(120%)}
.vlg-btn:active{transform:translateY(1px) scale(.995)}
.vlg-btn:disabled{cursor:default;filter:saturate(.7) brightness(.9)}
.vlg-spin{width:16px;height:16px;border-radius:50%;border:2px solid rgba(20,16,10,.25);border-top-color:#14100a;animation:vlg-turn .7s linear infinite}
@keyframes vlg-turn{to{transform:rotate(360deg)}}
.vlg-ghost{height:44px;border-radius:12px;border:1px solid var(--vlg-line);background:var(--vlg-field);color:var(--vlg-text);font:inherit;font-size:14px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:9px;transition:border-color .2s}
.vlg-ghost:hover{border-color:var(--vlg-line-strong)}
.vlg-or{position:relative;text-align:center;font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:#6f685d}
.vlg-or::before{content:"";position:absolute;left:0;right:0;top:50%;height:1px;background:var(--vlg-line)}
.vlg-or span{position:relative;padding:0 10px;background:#13110e}
.vlg-back{justify-self:start;display:inline-flex;align-items:center;gap:6px}
.vlg-back svg{width:15px;height:15px}
.vlg-done{display:grid;gap:14px;justify-items:start}
.vlg-tick{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:rgba(var(--vlg-glow),.12);border:1px solid var(--vlg-line-strong);color:var(--vlg-gold)}
.vlg-tick svg{width:20px;height:20px}
.vlg-policy{display:flex;flex-wrap:wrap;justify-content:center;gap:12px 20px}
.vlg-foot{color:#6f685d;font-size:11.5px;letter-spacing:.14em;text-transform:uppercase}
.vlg-sup{height:36px;padding:0 14px;border-radius:10px;border:1px solid var(--vlg-line);background:rgba(19,17,14,.6);color:var(--vlg-text);font:inherit;font-size:13px;cursor:pointer;transition:border-color .2s}
.vlg-sup:hover{border-color:var(--vlg-line-strong)}
@media (max-width:440px){.vlg-card{padding:24px 20px 22px;border-radius:18px}.vlg h1{font-size:20px}.vlg-logo{width:min(300px,100%)}}
@media (prefers-reduced-motion:reduce){.vlg-light i,.vlg-card,.vlg-pane,.vlg-spin{animation:none!important}.vlg-light i{opacity:.8}.vlg-btn::after{display:none}}
`;

export default function LoginVivox({
  onSubmit,
  onForgotPassword,
  onGoogleSignIn,
  loading = false,
  error = null,
  defaultEmail = '',
  onSupportClick,
}: LoginVivoxProps) {
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState(defaultEmail);
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(Boolean(defaultEmail));
  const [showPassword, setShowPassword] = useState(false);
  const [errEmail, setErrEmail] = useState('');
  const [errSenha, setErrSenha] = useState('');

  const [recEmail, setRecEmail] = useState('');
  const [recMsg, setRecMsg] = useState('');
  const [recErr, setRecErr] = useState('');
  const [recAlert, setRecAlert] = useState<string | null>(null);
  const [recLoading, setRecLoading] = useState(false);

  const lightRef = useRef<HTMLDivElement | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);
  const senhaRef = useRef<HTMLInputElement | null>(null);
  const recRef = useRef<HTMLInputElement | null>(null);

  // A luz acompanha o cursor de leve (desligado com "reduzir movimento").
  useEffect(() => {
    const el = lightRef.current;
    if (!el || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const loop = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      el.style.setProperty('--vlg-px', `${cx.toFixed(1)}px`);
      el.style.setProperty('--vlg-py', `${cy.toFixed(1)}px`);
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.3 ? requestAnimationFrame(loop) : 0;
    };
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 60;
      ty = (e.clientY / window.innerHeight - 0.5) * 40;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const openForgot = () => {
    setRecEmail(EMAIL_RE.test(email.trim()) ? email.trim() : '');
    setRecErr('');
    setRecAlert(null);
    setView('forgot');
    window.setTimeout(() => recRef.current?.focus(), 30);
  };

  const backToLogin = () => {
    setView('login');
    window.setTimeout(() => emailRef.current?.focus(), 30);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const mail = email.trim();
    let ok = true;
    if (!mail) {
      setErrEmail('Digite o seu e-mail.');
      ok = false;
    } else if (!EMAIL_RE.test(mail)) {
      setErrEmail(EMAIL_HINT);
      ok = false;
    } else setErrEmail('');
    if (!senha) {
      setErrSenha('Digite a sua senha.');
      ok = false;
    } else setErrSenha('');
    if (!ok) {
      (EMAIL_RE.test(mail) ? senhaRef.current : emailRef.current)?.focus();
      return;
    }
    void onSubmit({ email: mail, senha, lembrar });
  };

  const handleForgot = async (e: FormEvent) => {
    e.preventDefault();
    if (recLoading) return;
    const mail = recEmail.trim();
    if (!EMAIL_RE.test(mail)) {
      setRecErr(mail ? EMAIL_HINT : 'Digite o seu e-mail.');
      recRef.current?.focus();
      return;
    }
    setRecErr('');
    setRecAlert(null);
    setRecLoading(true);
    try {
      await onForgotPassword?.({ email: mail, mensagem: recMsg.trim() });
      setView('sent');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setRecAlert(msg || 'Não foi possível enviar o pedido agora. Tente de novo em instantes.');
    } finally {
      setRecLoading(false);
    }
  };

  return (
    // data-theme="dark" força o tema escuro apenas nesta tela.
    <section data-theme="dark" className="vlg">
      <style>{CSS}</style>
      <main className="vlg-stage">
        <div className="vlg-grid" aria-hidden="true" />
        <div className="vlg-dust" aria-hidden="true" />
        <div className="vlg-light" ref={lightRef} aria-hidden="true">
          <i />
          <i />
        </div>
        <div className="vlg-vignette" aria-hidden="true" />

        {onSupportClick && (
          <div className="vlg-top">
            <button type="button" className="vlg-sup" onClick={onSupportClick}>
              Suporte
            </button>
          </div>
        )}

        <div className="vlg-wrap">
          <VivoxLogo className="vlg-logo" />

          <div className="vlg-card" aria-live="polite">
            {view === 'login' && (
              <div className="vlg-pane">
                <div className="vlg-head">
                  <h1>Entrar no sistema</h1>
                  <p className="vlg-sub">
                    Sistema de gestão VIVOX.<br />
                    Entre com o seu e-mail e a sua senha.
                  </p>
                </div>
                <form onSubmit={handleSubmit} noValidate>
                  <div className="vlg-fld">
                    <label htmlFor="vlg-email">E-mail</label>
                    <div className={`vlg-inp${errEmail ? ' bad' : ''}`}>
                      <Mail className="vlg-ic" aria-hidden="true" />
                      <input
                        id="vlg-email"
                        ref={emailRef}
                        type="email"
                        inputMode="email"
                        autoComplete="username"
                        autoCapitalize="none"
                        spellCheck={false}
                        disabled={loading}
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setErrEmail(''); }}
                        placeholder="nome@vivoxmarketing.com.br"
                        aria-describedby={errEmail ? 'vlg-err-email' : undefined}
                      />
                    </div>
                    {errEmail && <p className="vlg-err" id="vlg-err-email" role="alert">{errEmail}</p>}
                  </div>

                  <div className="vlg-fld">
                    <label htmlFor="vlg-senha">Senha</label>
                    <div className={`vlg-inp${errSenha ? ' bad' : ''}`}>
                      <Lock className="vlg-ic" aria-hidden="true" />
                      <input
                        id="vlg-senha"
                        ref={senhaRef}
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        disabled={loading}
                        value={senha}
                        onChange={(e) => { setSenha(e.target.value); setErrSenha(''); }}
                        placeholder="••••••••"
                        aria-describedby={errSenha ? 'vlg-err-senha' : undefined}
                      />
                      <button
                        type="button"
                        className="vlg-eye"
                        aria-label={showPassword ? 'Ocultar a senha' : 'Mostrar a senha'}
                        aria-pressed={showPassword}
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    {errSenha && <p className="vlg-err" id="vlg-err-senha" role="alert">{errSenha}</p>}
                  </div>

                  <div className="vlg-row">
                    <label className="vlg-chk" htmlFor="vlg-lembrar">
                      <input id="vlg-lembrar" type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} />
                      <span className="vlg-box"><Check strokeWidth={3} /></span>
                      Manter conectado
                    </label>
                    <button type="button" className="vlg-link" onClick={openForgot}>
                      Esqueci minha senha
                    </button>
                  </div>

                  {error && <div role="alert" className="vlg-alert">{error}</div>}

                  <button type="submit" className="vlg-btn" disabled={loading}>
                    {loading ? (<><span className="vlg-spin" aria-hidden="true" />Entrando…</>) : 'Entrar'}
                  </button>

                  {onGoogleSignIn && (
                    <>
                      <div className="vlg-or"><span>ou</span></div>
                      <button type="button" className="vlg-ghost" onClick={onGoogleSignIn}>
                        <GoogleIcon className="h-4 w-4" />
                        Continuar com Google
                      </button>
                    </>
                  )}
                </form>
              </div>
            )}

            {view === 'forgot' && (
              <div className="vlg-pane">
                <button type="button" className="vlg-link vlg-back" onClick={backToLogin}>
                  <ArrowLeft aria-hidden="true" />
                  Voltar
                </button>
                <h1>Esqueci minha senha</h1>
                <p className="vlg-sub">Envie um pedido ao suporte. A equipe ajuda você a criar uma nova senha.</p>
                <form onSubmit={handleForgot} noValidate>
                  <div className="vlg-fld">
                    <label htmlFor="vlg-rec-email">E-mail</label>
                    <div className={`vlg-inp${recErr ? ' bad' : ''}`}>
                      <Mail className="vlg-ic" aria-hidden="true" />
                      <input
                        id="vlg-rec-email"
                        ref={recRef}
                        type="email"
                        inputMode="email"
                        autoComplete="username"
                        autoCapitalize="none"
                        spellCheck={false}
                        disabled={recLoading}
                        value={recEmail}
                        onChange={(e) => { setRecEmail(e.target.value); setRecErr(''); }}
                        placeholder="nome@vivoxmarketing.com.br"
                      />
                    </div>
                    {recErr && <p className="vlg-err" role="alert">{recErr}</p>}
                  </div>
                  <div className="vlg-fld">
                    <label htmlFor="vlg-rec-msg">Mensagem <span className="vlg-opt">(opcional)</span></label>
                    <div className="vlg-inp area">
                      <textarea
                        id="vlg-rec-msg"
                        rows={3}
                        maxLength={300}
                        disabled={recLoading}
                        value={recMsg}
                        onChange={(e) => setRecMsg(e.target.value)}
                        placeholder="Conte o que aconteceu, se quiser"
                      />
                    </div>
                  </div>
                  {recAlert && <div role="alert" className="vlg-alert">{recAlert}</div>}
                  <button type="submit" className="vlg-btn" disabled={recLoading}>
                    {recLoading ? (<><span className="vlg-spin" aria-hidden="true" />Enviando…</>) : 'Enviar ao suporte'}
                  </button>
                </form>
              </div>
            )}

            {view === 'sent' && (
              <div className="vlg-pane vlg-done">
                <span className="vlg-tick"><Check aria-hidden="true" strokeWidth={2.4} /></span>
                <h1>Pedido enviado ao suporte</h1>
                <p className="vlg-sub" style={{ margin: 0 }}>
                  O suporte vai entrar em contato com <b>{recEmail.trim()}</b> para ajudar com a nova senha.
                </p>
                <button type="button" className="vlg-link" onClick={backToLogin}>
                  Voltar para a entrada
                </button>
              </div>
            )}
          </div>

          <p className="vlg-foot">VIVOX · Agência &amp; Produtora</p>
          <nav className="vlg-policy" aria-label="Informações do sistema">
            <a className="vlg-link" href="/sobre/">Sobre o VIVOX</a>
            <a className="vlg-link" href="/privacidade/">Privacidade</a>
            <a className="vlg-link" href="/termos/">Termos de uso</a>
          </nav>
        </div>
      </main>
    </section>
  );
}
