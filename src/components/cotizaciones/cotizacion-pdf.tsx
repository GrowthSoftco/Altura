"use client"

import {
  Document, Page, Text, View, StyleSheet,
  Font, Svg, Path, Image,
} from "@react-pdf/renderer"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CotizacionCompleta, ServicioItem, Tramo } from "@/types"
import { formatCOP, calcularDuracion } from "@/lib/calculos"

// ─── Fonts ────────────────────────────────────────────────────────────────────
Font.registerHyphenationCallback((word) => [word])
let _fontsRegistered = false
function ensureFonts() {
  if (_fontsRegistered || typeof window === "undefined") return
  const origin = window.location.origin
  Font.register({
    family: "Poppins",
    fonts: [
      { src: `${origin}/fonts/poppins-regular.ttf`,  fontWeight: 400 },
      { src: `${origin}/fonts/poppins-medium.ttf`,   fontWeight: 500 },
      { src: `${origin}/fonts/poppins-semibold.ttf`, fontWeight: 600 },
    ],
  })
  Font.register({ family: "EduNSW", src: `${origin}/fonts/edu-nsw-cursive.ttf` })
  _fontsRegistered = true
}

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  navy:   "#272F46",
  aqua:   "#00B4C5",
  black:  "#1C1C1C",
  g1:     "#444444",
  g2:     "#909090",
  g3:     "#DDDDDD",
  bg:     "#F8F8F6",
  border: "#E2E2DE",
  white:  "#FFFFFF",
  amber:  "#C07000",
}
const PAD = 28

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  page:     { fontFamily: "Poppins", backgroundColor: T.white, padding: 0 },
  content:  { paddingHorizontal: PAD },
  secLabel: { fontSize: 6.5, fontWeight: 500, color: T.g2, letterSpacing: 1.6, textTransform: "uppercase", marginBottom: 6 },

  box:      { backgroundColor: T.bg, borderWidth: 0.5, borderColor: T.border, borderRadius: 6, marginBottom: 18 },
  boxRow:   { flexDirection: "row" },
  boxCell:  { flex: 1, paddingHorizontal: 14, paddingVertical: 11 },
  boxDivH:  { borderTopWidth: 0.4, borderTopColor: T.g3 },
  boxDivV:  { borderLeftWidth: 0.4, borderLeftColor: T.g3 },
  boxLbl:   { fontSize: 6.5, color: T.g2, marginBottom: 5 },
  boxVal:   { fontSize: 10.5, fontWeight: 600, color: T.black },

  detColH:     { fontSize: 6.5, fontWeight: 500, color: T.g2, letterSpacing: 1.4, textTransform: "uppercase" },
  detColV:     { fontSize: 10, fontWeight: 600, color: T.black },
  detColVAqua: { fontSize: 9,  fontWeight: 600, color: T.aqua },

  svcGrid:  { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 14, paddingVertical: 12 },
  svcItem:  { width: "33%", flexDirection: "row", alignItems: "flex-start", paddingVertical: 5, paddingRight: 8 },
  svcText:  { fontSize: 8, color: T.g1, flex: 1 },

  tramoBox:    { backgroundColor: T.bg, borderWidth: 0.5, borderColor: T.border, borderRadius: 6, marginBottom: 12 },
  tramoHdr:    { backgroundColor: T.navy, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12 },
  tramoHdrFlat:{ backgroundColor: T.navy, height: 6, marginTop: -6 },
  tramoHdrTxt: { fontSize: 7.5, fontWeight: 600, color: T.white },
  tramoRow:    { flexDirection: "row", paddingHorizontal: 10, paddingTop: 8, paddingBottom: 7 },
  tramoHr:     { borderTopWidth: 0.4, borderTopColor: T.g3, marginHorizontal: 10 },
  tramoColH:   { fontSize: 6, fontWeight: 500, color: T.g2, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 4 },
  tramoColV:   { fontSize: 8.5, fontWeight: 600, color: T.black },
  tramoColAqua:{ fontSize: 8,   fontWeight: 600, color: T.aqua },

  planBox:  { backgroundColor: T.bg, borderWidth: 0.5, borderColor: T.border, borderRadius: 6, flexDirection: "row", marginBottom: 0 },
  planL:    { width: 155, paddingHorizontal: 14, paddingVertical: 14 },
  planDivV: { borderLeftWidth: 0.4, borderLeftColor: T.g3 },
  planR:    { flex: 1, paddingHorizontal: 12, paddingVertical: 12 },
  planSm:   { fontSize: 6.5, color: T.g2, marginBottom: 3 },
  planMed:  { fontSize: 9, fontWeight: 600, color: T.black },
  planBig:  { fontSize: 17, fontWeight: 600, color: T.navy },

  cuotaRow: { flexDirection: "row", alignItems: "center", paddingVertical: 5 },
  cuotaHr:  { borderTopWidth: 0.3, borderTopColor: T.g3 },
  cuotaNum: { width: 22, fontSize: 8, color: T.g1 },
  cuotaFch: { flex: 1, fontSize: 8, color: T.g1 },
  cuotaVal: { fontSize: 8.5, fontWeight: 600, color: T.navy },
  cuotaHH:  { fontSize: 6, fontWeight: 500, color: T.g2, letterSpacing: 1.2, textTransform: "uppercase" },

  tcTitle: { fontSize: 20, fontWeight: 600, color: T.black, marginBottom: 10 },
  tcHr:    { borderBottomWidth: 0.8, borderBottomColor: T.g3, marginBottom: 14 },
  tcItem:  { flexDirection: "row", marginBottom: 9 },
  tcText:  { fontSize: 8, color: T.g1, lineHeight: 1.75, flex: 1 },
})

// ─── Logo paths (full wordmark, 412×127) ─────────────────────────────────────
const LOGO_PATHS = [
  "M378.702 21.7567C372.13 17.1767 364.951 15.1931 357.764 11.9118C356.957 11.5426 356.303 10.9906 356.048 10.1076C357.153 5.13658 381.689 10.0288 386.069 10.1681C394.297 10.4296 404.113 -5.29253 411.803 1.87307V2.13846C410.738 3.65186 409.916 5.6391 408.626 7.23939C406.027 10.4628 400.185 15.9446 398.615 19.4443C396.452 24.2645 404.03 42.3236 401.628 46.2098C399.881 47.5192 398.418 46.3874 397.168 45.0555C393.552 41.2073 390.795 31.6527 386.601 28.8695C384.152 29.9107 377.16 34.7474 375.956 37.2998C375.076 39.1711 376.865 46.5612 375.281 48.0655C374.816 48.0095 374.427 47.9163 374.122 47.4944C371.689 44.106 371.736 42.4759 368.583 39.3863C365.174 36.0464 358.097 35.4859 355.985 33.1069C355.364 30.0376 368.518 30.8446 370.484 30.3121C373.288 29.553 377.241 23.9778 378.702 21.7567Z",
  "M236.2 0.580078C237.519 0.69226 240.794 0.592258 242.281 0.590756L255.422 0.594938C262.627 0.619766 266.802 0.318949 273.669 2.52913C289.881 7.74655 293.989 31.1637 279.681 40.7962C277.282 42.4109 275.115 43.2767 272.541 44.4938C278.275 49.8525 283.339 56.5776 288.88 62.2074C290.92 64.2793 292.358 66.5903 294.69 68.4618C296.733 64.0905 298.94 57.2926 300.86 52.5345L321.138 0.792972C322.79 0.630424 323.749 0.635479 325.397 0.673847C327.347 4.49311 329.041 8.55163 330.81 12.4667L339.251 30.8748L345.062 43.5388C346.744 47.1282 348.859 51.2764 350.005 55.0656C348.601 55.1624 347.195 55.2359 345.789 55.2862C344.393 52.6642 343.332 49.9528 342.063 47.2721L332.318 26.4801C330.612 22.8312 329.333 19.7185 327.454 16.0883C321.377 28.8679 317.366 43.5715 311.768 56.6389C310.238 60.2082 309.207 65.1954 307.272 68.4501C306.811 68.8557 306.099 68.7889 305.462 68.8114L302.394 68.6435C302.826 67.1953 303.83 64.8852 304.396 63.3858L309.057 51.2009L323.504 13.6236C324.068 12.1942 325.677 8.80054 323.477 8.11852C322.159 9.17347 319.15 18.536 318.397 20.4621L308.213 46.603C306.762 50.3554 305.269 54.1863 303.812 57.9296C302.225 62.0094 300.982 64.3635 299.878 68.7728C296.11 68.6868 292.322 68.8479 288.653 68.7444C285.062 65.3347 281.787 60.913 278.38 57.3098C273.687 52.3455 269.331 47.0831 264.692 42.0891C269.564 41.3833 275.085 39.4391 278.611 35.8653C281.84 32.6038 283.631 28.1851 283.583 23.5945C283.546 18.5721 281.669 13.812 278.037 10.3207C271.512 4.04554 261.862 4.37165 253.498 4.3708L240.808 4.41217C240.38 20.9094 241.05 37.6532 240.764 54.1784C240.683 58.872 240.626 64.1428 240.987 68.7937C239.339 68.8183 237.722 68.7641 236.077 68.717L236.127 18.9359L236.054 7.14772C236.044 5.64522 235.955 1.86881 236.2 0.580078Z",
  "M26.8903 0.648853C27.9417 0.568969 29.1246 0.650457 30.1887 0.697392C31.1701 2.62753 32.1706 5.37471 33.093 7.43176L41.573 26.4777L61.0931 68.7546L56.1214 68.6998C55.4386 66.5347 53.5756 63.0063 52.5564 60.8416L46.5263 47.787L37.9232 29.0465C35.7446 24.2751 34.6562 21.4679 32.0935 16.6006L18.894 51.365C16.85 56.8113 14.5327 63.406 12.303 68.7193C10.7195 68.742 9.01601 68.6892 7.42258 68.6667C7.72931 67.5997 8.25376 66.3459 8.66235 65.2935C9.50799 62.9646 10.5321 60.7567 11.4316 58.4512C16.3845 45.7555 21.0393 32.9569 26.0853 20.292C27.4282 16.9217 28.8213 13.3027 29.8943 9.85533L28.7773 7.72486C27.3036 9.82885 26.4009 12.8614 25.4503 15.3204L21.5582 25.4358C17.3808 36.57 13.0444 47.6437 8.55053 58.6536C7.2473 61.8818 6.26473 65.6855 4.84916 68.7075C3.14596 68.8048 1.70413 68.7656 0 68.7211C1.59168 63.6244 4.81322 55.9659 6.83197 50.9334L16.3881 26.6876L23.3701 8.77675C24.2052 6.68892 25.812 2.39041 26.8903 0.648853Z",
  "M165.913 0.594727C167.305 0.667566 169.109 0.63541 170.534 0.650818L170.503 30.6234C170.499 32.9887 170.507 35.3734 170.488 37.7317C170.426 45.2812 169.992 53.4532 175.666 59.363C180.691 64.5967 187.59 66.6709 194.697 66.7175C202.362 66.7679 210.101 65.8836 215.713 60.1036C219.992 56.2474 221.502 51.4983 221.64 45.7757C222.001 30.7714 221.482 15.6299 221.816 0.612043L226.335 0.659263L226.213 4.48348L226.219 44.4673C226.179 52.0423 225.317 57.5152 219.513 63.0874C212.605 69.6447 205.247 70.7736 196.153 70.9253C183.254 71.1403 169.175 65.5927 166.467 51.5174C165.346 45.6941 165.868 37.7435 165.876 31.5676L165.913 0.594727Z",
  "M215.115 0.517578C216.312 0.638733 218.268 0.657268 219.522 0.702863C219.662 7.91799 219.491 15.0589 219.323 22.2635C219.244 25.6169 219.648 29.4398 219.546 32.854C219.293 41.3399 221.044 51.794 214.232 58.2778C209.162 63.1023 203.267 64.1869 196.576 64.2458C189.782 64.5093 183.034 62.8203 177.996 58.0202C174.31 54.5078 173.25 50.1305 173.269 45.1743C173.284 41.5544 173.279 37.9005 173.28 34.2791L173.258 9.10147C173.227 6.27345 173.257 3.44507 173.348 0.618351L177.606 0.678807L177.583 1.12301C176.963 14.7891 178.049 30.1099 177.582 43.5218C176.798 66.04 212.597 64.3556 214.297 48.4902C215.876 33.7646 214.553 15.6206 215.115 0.517578Z",
  "M180.174 0.533203C181.094 0.654013 183.501 0.633327 184.543 0.648126C184.457 10.4956 184.442 20.3434 184.498 30.1911C184.502 34.2523 184.497 38.3135 184.522 42.375C184.529 43.4845 184.609 44.4136 184.738 45.52C185.309 50.4489 189.797 53.2497 194.407 53.5628C198.082 53.8121 201.829 53.765 204.787 51.3392C207.697 48.9614 207.518 45.8162 207.516 42.3893C207.516 40.0591 207.508 37.7209 207.506 35.3906L207.492 13.5916C207.49 9.81258 207.341 4.41111 207.664 0.752411C209.302 0.619258 210.683 0.595283 212.323 0.579144L212.307 4.78854L212.323 42.5275C212.294 46.7521 212.24 50.5022 208.985 53.563C205.528 56.7971 200.798 57.9183 196.195 57.9128C189.771 57.9053 181.426 54.9057 180.512 47.6023C179.83 42.1558 180.104 36.1289 180.102 30.5537C180.065 20.5467 180.089 10.5398 180.174 0.533203Z",
  "M243.535 7.21266C249.895 7.32281 256.294 7.07273 262.696 7.24299C273.042 7.55641 281.272 13.2121 280.821 24.4754C280.393 35.1262 270.075 40.0109 260.6 39.5014L259.75 35.4114C265.723 34.8223 273.301 33.8076 275.424 27.215C277.767 19.9404 273.711 14.4147 267.046 12.1972C261.892 11.2541 253.573 11.5152 248.066 11.5252L248.079 68.7168C246.575 68.7897 244.948 68.799 243.432 68.835L243.393 30.8695C243.396 23.6733 243.138 14.2753 243.535 7.21266Z",
  "M137.768 96.5171C138.641 96.4853 139.46 96.5806 140.165 97.1558C140.601 97.5121 140.874 98.0308 140.92 98.5923C141.023 99.7364 140.845 100.65 140.092 101.526L139.769 101.523C139.089 100.68 139.209 99.031 138.491 98.1656C136.061 97.9711 132.944 105.508 133.507 107.769C133.986 109.69 135.275 109.994 136.889 109.613C139.841 108.917 142.15 105.408 143.457 102.912C144.375 101.198 144.572 98.198 146.654 97.858C148.916 98.9668 144.87 105.634 145.83 107.223C148.694 107.658 152.893 100.467 155.535 99.1539C157.063 98.3943 156.654 98.4844 158.589 98.064L162.66 99.2418C161.981 101.18 159.119 108.174 160.226 109.6C162.908 110.139 167.384 103.635 168.959 103.435L169.098 103.752C167.805 108 157.037 117.778 157.689 105.451C155.523 105.674 154.801 109.998 150.781 106.39C147.845 108.991 146.394 110.326 143.1 107.377C140.732 109.545 137.757 112.308 134.298 111.503C131.731 110.904 130.828 109.03 130.721 106.623C123.315 112.425 123.054 106.655 124.18 100.645C124.255 100.245 124.297 99.6338 124.344 99.2086C121.905 101.486 116.846 109.317 115.743 109.586L115.331 109.287C114.935 108.539 114.904 108.379 114.861 107.533L115.501 105.302C111.411 109.065 107.782 111.08 103.56 106.469C100.874 108.491 101.235 109.511 100.308 112.586C99.2005 116.262 97.5213 119.992 94.9477 122.877C92.5653 125.546 88.4057 126.593 89.1685 121.455C89.7151 117.753 91.9642 114.019 94.5503 111.362C97.8328 107.989 98.5056 107.014 98.5669 102.435C97.6687 103.406 90.7049 110.448 89.7612 106.318C88.9863 102.926 94.6786 96.4721 98.6313 97.5894C100.128 98.0129 100.441 98.1251 101.914 98.9976C102.141 101.41 101.995 103.842 101.479 106.21C104.036 103.987 105.214 101.285 107.624 98.7877C108.864 97.3068 112.477 96.3627 112.72 99.1568C113.01 102.49 106.872 104.802 106.695 106.786C108.407 109.533 114.753 103.888 115.858 102.176C116.672 100.916 117.835 97.3942 119.286 97.8726C120.211 98.9265 120.085 99.5623 120.08 100.944C121.31 99.3913 124.186 95.8359 126.252 97.9127C127.488 99.1546 126.189 105.592 126.087 107.492C132.643 104.936 131.558 98.242 137.768 96.5171Z",
  "M70.9166 0.52832C72.3347 0.612832 73.9461 0.626028 75.3809 0.66939L75.3969 65.4221C83.9779 65.5941 92.6739 65.3939 101.264 65.4684C105.454 65.5048 109.735 65.3748 113.911 65.6046C113.943 66.544 114.021 67.6398 113.865 68.5523L113.554 68.7289C111.194 68.8191 108.77 68.8649 106.409 68.8292C94.635 68.6502 82.6606 69.1272 70.9081 68.7362C70.6216 64.0054 70.7847 58.6143 70.8273 53.8517L70.86 36.816C70.9024 24.5758 70.5008 12.8554 70.9166 0.52832Z",
  "M78.2393 0.615234L82.509 0.676482C82.4031 20.0124 82.4218 39.3489 82.565 58.6845C92.7435 58.9387 103.263 58.6711 113.51 58.8049C113.521 60.0217 113.53 61.1517 113.473 62.3712C101.654 62.4481 89.8342 62.4631 78.0149 62.4162L78.2393 0.615234Z",
  "M84.9014 0.644531L88.969 0.645972L88.9747 52.0324C95.7462 52.3219 106.496 52.4489 113.358 52.1093C113.38 53.2809 113.491 54.6329 113.558 55.8174C112.367 56.0363 106.046 55.9667 104.417 55.9677L84.9251 55.9391L84.9014 0.644531Z",
  "M108.082 13.7021C114.796 13.8428 121.574 13.6447 128.297 13.8477L128.29 68.7491C126.856 68.8268 125.113 68.7635 123.656 68.7478L123.694 18.0506C119.123 17.745 112.766 17.9478 108.075 17.9696C108.046 16.5735 108.076 15.1043 108.082 13.7021Z",
  "M130.822 13.7344C132.302 13.7995 133.921 13.7985 135.413 13.8271L135.456 68.7758C133.946 68.7851 132.314 68.7251 130.795 68.6944C130.724 50.5289 130.592 31.8765 130.822 13.7344Z",
  "M138.084 13.7061C143.703 13.9269 150.259 13.7812 155.984 13.8059L155.994 18.2593C151.756 18.0638 146.537 18.1267 142.27 18.2366C142.074 22.2744 142.201 27.3496 142.203 31.4347L142.22 54.9817C142.217 59.5734 142.259 64.165 142.349 68.7558C140.922 68.8062 139.457 68.7609 138.027 68.7361L138.084 13.7061Z",
  "M108.08 7.23186L155.931 7.22656L156.018 11.2472L108.061 11.3063C108.036 9.97047 108.069 8.57269 108.08 7.23186Z",
  "M108.071 0.542969C113.646 0.759943 120.103 0.592076 125.778 0.585214L155.983 0.625816L155.892 4.41341C147.873 4.28275 139.667 4.36865 131.63 4.3681C123.784 4.32605 115.937 4.35155 108.09 4.44457C108.069 3.1561 108.077 1.83426 108.071 0.542969Z",
  "M32.5249 0.674557C34.1264 0.625734 35.7292 0.636452 37.3299 0.706713C39.1388 3.63256 40.1141 6.75293 41.6148 9.76461C43.3807 13.3084 44.8718 16.8911 46.5391 20.4565L69.0015 68.6935C67.4239 68.7309 65.8464 68.7516 64.2684 68.756C61.0862 62.909 58.0814 55.7786 55.2359 49.625L41.7946 20.8651C38.7415 14.2274 35.7821 7.13943 32.5249 0.674557Z",
  "M24.3816 56.3994C31.7675 56.3838 39.7887 56.2159 47.1301 56.5669C48.6411 59.1742 50.9571 64.7485 51.8618 67.6873C50.2508 67.6625 48.3037 67.495 46.6705 67.3947C45.6165 65.4901 44.6908 62.9503 43.8753 60.8821C42.7346 60.6969 38.3679 60.7649 37.019 60.7678L23.4521 60.8181C22.7137 63.0605 22.0009 65.3184 20.9912 67.4506L16.3467 67.5383C17.2986 63.9611 18.8062 59.8406 20.501 56.5513C21.7219 56.464 23.1426 56.4463 24.3816 56.3994Z",
  "M30.3663 35.418L34.9121 35.5578C36.494 37.6659 41.1293 48.6011 42.1818 51.365C38.5727 51.4765 34.5431 51.3912 30.9024 51.3912L24.3518 51.3987C24.8187 49.6604 25.3235 48.4919 26.212 46.9411L35.419 46.7911C33.5764 42.9804 32.0295 39.3102 30.3663 35.418Z",
  "M328.228 0.572266C329.344 0.680205 331.819 0.612318 333.04 0.609923C333.783 2.76308 336.478 8.15492 337.592 10.6431C341.463 19.2945 345.787 27.9351 349.634 36.5948C351.178 40.0664 354.347 46.0196 355.331 49.4876C355.346 50.0607 354.94 50.4263 354.566 50.8687C353.992 51.2743 352.984 51.8329 352.349 52.2099C350.723 50.1874 349.137 46.1266 348.003 43.6383L342.116 30.7681L333.142 11.6867C331.557 8.28899 329.419 4.0982 328.228 0.572266Z",
  "M319.45 56.4008C324.715 56.389 336.108 56.0547 341.785 56.7865C342.713 56.9057 343.354 59.6964 343.634 60.7825L328.664 60.7782L318.841 60.7973C318.399 62.3166 317.35 65.6192 316.236 66.6841C314.826 68.0327 312.632 67.7036 310.814 67.6472C312.05 64.3971 314.032 59.7859 315.39 56.5122L319.45 56.4008Z",
  "M326.081 35.4473C327.688 35.4712 329.404 35.5652 331.019 35.6241C333.314 39.8081 336.4 46.9767 338.415 51.4091L326.635 51.3854L318.847 51.4079C319.328 49.9448 320.032 48.3953 320.641 46.9686C324.125 46.7942 327.59 47.0443 331.137 46.7546C329.66 42.7403 327.958 39.2711 326.081 35.4473Z",
]

// Watermark mark path
const MARK_PATH = "M274.866 2.40356C277.385 4.64385 429.959 284.497 436.638 299.756C430.768 303.016 418.432 307.249 411.842 309.708C398.823 314.552 385.831 319.467 372.867 324.454C323.892 343.421 275.075 362.802 226.421 382.579C205.375 391.099 175.281 401.307 156.185 411.852C177.9 406.414 202.658 400.413 223.588 393.056C251 383.426 278.354 373.016 305.693 363.086L442.521 313.849L500.262 293.37C510.971 289.625 525.122 284.395 535.962 281.61C508.414 296.286 480.967 311.149 453.621 326.194C461.784 344.097 480.254 375.417 490.257 393.634L559.023 519.064C560.44 521.614 563.254 526.159 563.074 528.836C560.051 530.006 450.447 500.366 437.535 497.014C429.421 482.224 421.281 464.884 413.73 449.666L374.539 370.496C363.525 375.401 346.375 385.361 335.415 391.354L264.011 430.624L116.339 510.514C79.9349 530.284 39.9455 553.084 2.96304 571.264C6.89625 562.031 12.6953 550.826 17.1056 541.564L133.097 298.197L213.043 132.043C232.591 90.6936 253.96 42.7985 274.866 2.40356ZM276.812 171.826C275.784 180.241 274.695 209.13 272.278 214.564C253.606 256.53 228.192 301.285 209.914 343.301C220.806 337.076 231.134 330.641 241.886 324.329L294.513 292.827C305.251 286.353 316.866 278.929 327.821 273.042C322.359 261.396 281.008 175.468 276.812 171.826ZM668.917 206.917C673.523 206.475 681.483 206.188 684.236 210.238C684.889 224.047 646.577 243.962 635.204 249.748C629.188 263.464 624.139 277.534 617.98 291.322C613.359 294.451 610.568 296.322 605.489 298.854C604.672 289.822 605.377 273.094 605.497 263.186C594.297 267.266 580.479 271.792 569.586 276.924C565.243 278.971 561.881 286.739 555.077 285.957C553.855 284.909 551.972 277.096 551.192 274.679L532.152 261.848C534.312 260.625 536.488 259.671 538.738 258.632C546.99 259.854 556.255 261.775 564.529 263.294C572.714 258.528 581.303 252.909 589.375 247.847C578.715 241.53 563.734 236.122 552.024 230.197C564.994 223.981 568.775 225.033 583.126 226.975C593.666 228.401 605.265 230.574 615.782 230.94C634.214 219.625 646.944 209.854 668.917 206.917Z"

// ─── Sub-components ───────────────────────────────────────────────────────────
function LogoFull({ color = T.white, width = 140 }: { color?: string; width?: number }) {
  const h = Math.round(width * (127 / 412))
  return (
    <Svg width={width} height={h} viewBox="0 0 412 127">
      {LOGO_PATHS.map((d, i) => <Path key={i} d={d} fill={color} />)}
    </Svg>
  )
}

function Watermark() {
  const W = 360; const H = Math.round(W * (575 / 686))
  return (
    <View style={{ position: "absolute", top: Math.round((842 - H) / 2), left: Math.round((595 - W) / 2), width: W, height: H }}>
      <Svg width={W} height={H} viewBox="0 0 686 575">
        <Path d={MARK_PATH} fill={T.aqua} fillOpacity={0.07} />
      </Svg>
    </View>
  )
}

function PageHeader({ url }: { url: string }) {
  return (
    <View fixed>
      <View style={{ height: 100, position: "relative" }}>
        <Image src={url} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 100 }} />
        <View style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 100, backgroundColor: "#000", opacity: 0.25 }} />
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: 78, alignItems: "center", justifyContent: "center" }}>
          <LogoFull color={T.white} width={140} />
        </View>
      </View>
      <View style={{ backgroundColor: T.navy, paddingVertical: 6 }}>
        <Text style={{ fontSize: 8, fontWeight: 600, color: T.aqua, textAlign: "center", letterSpacing: 1.5 }}>
          COTIZACIÓN DE VIAJE
        </Text>
      </View>
    </View>
  )
}

function Check() {
  return (
    <Svg width={9} height={9} viewBox="0 0 24 24" style={{ marginRight: 6, marginTop: 1 }}>
      <Path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill={T.aqua} />
    </Svg>
  )
}

function TramoBlock({ tramo, num }: { tramo: Tramo; num: number }) {
  const noches = (tramo.fechaSalida && tramo.fechaRegreso)
    ? Math.max(Math.round((new Date(tramo.fechaRegreso + "T12:00:00").getTime() - new Date(tramo.fechaSalida + "T12:00:00").getTime()) / 86400000), 1)
    : null
  const dias = noches ? noches + 1 : null
  const hasHotel = !!tramo.hotelNombre

  const fCols = ["Origen","Destino","Aerolínea","Salida","Llegada","Tiempo","Escala"]
  const fVals = [tramo.origen, tramo.destino, tramo.aerolineaIda, tramo.horaSalidaIda, tramo.horaLlegadaIda, tramo.tiempoVuelo, tramo.escalas]

  return (
    <View style={S.tramoBox}>
      <View style={S.tramoHdr}>
        <Text style={S.tramoHdrTxt}>TRAMO {num}  ·  {tramo.origen || "—"}  →  {tramo.destino || "—"}</Text>
      </View>
      <View style={S.tramoHdrFlat} />
      <View style={S.tramoRow}>
        {fCols.map((lbl, i) => (
          <View key={lbl} style={{ flex: 1 }}>
            <Text style={S.tramoColH}>{lbl}</Text>
            <Text style={S.tramoColV}>{fVals[i] || "—"}</Text>
          </View>
        ))}
      </View>
      {hasHotel && (
        <>
          <View style={S.tramoHr} />
          <View style={[S.tramoRow, { width: "100%" }]}>
            {[
              { lbl: "Hotel",         val: tramo.hotelNombre, aqua: false },
              { lbl: "Habitación",    val: tramo.hotelTipo,   aqua: false },
              { lbl: "Días / Noches", val: dias && noches ? `${dias} días / ${noches} noches` : null, aqua: true },
            ].map(({ lbl, val, aqua }) => (
              <View key={lbl} style={{ flex: 1 }}>
                <Text style={S.tramoColH}>{lbl}</Text>
                <Text style={aqua ? S.tramoColAqua : S.tramoColV}>{val || "—"}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </View>
  )
}

function Footer({ codigo }: { codigo?: string }) {
  const row = (label: string, value: string) => (
    <View style={{ flexDirection: "row", width: "48%", marginBottom: 3 }}>
      <Text style={{ fontSize: 7, fontWeight: 600, color: T.navy, width: 56 }}>{label}</Text>
      <Text style={{ fontSize: 7, color: T.g1, flex: 1 }}>{value}</Text>
    </View>
  )
  return (
    <View style={{ borderTopWidth: 0.5, borderTopColor: T.g3, paddingTop: 10, paddingHorizontal: PAD, paddingBottom: 8 }} fixed>
      <Text style={{ fontFamily: "EduNSW", fontSize: 11, color: T.navy, textAlign: "center", marginBottom: 8, letterSpacing: 1.5 }}>
        Ven y viaja con Altura
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {row("Email:", "agenciaviajesaltura@gmail.com")}
        {row("WhatsApp:", "304 208 6768  –  323 726 1564")}
        {row("Dirección:", "Calle 16#6-34 CC. Pasarela – Local 47 - Pereira")}
        {row("Facebook:", "Altura agencia de viajes")}
        {row("Instagram:", "@av.altura  ·  TikTok: @av.altura")}
        {codigo ? <View style={{ width: "48%", alignItems: "flex-end" }}><Text style={{ fontSize: 7, color: T.g2 }}>{codigo}</Text></View> : null}
      </View>
    </View>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function CotizacionPDF({ cotizacion }: { cotizacion: CotizacionCompleta }) {
  ensureFonts()
  const origin   = typeof window !== "undefined" ? window.location.origin : ""
  const cloudsUrl = `${origin}/nubes.jpg`

  const duracion  = calcularDuracion(new Date(cotizacion.fechaSalida), new Date(cotizacion.fechaRegreso))
  const activos   = (cotizacion.servicios as ServicioItem[]).filter(s => s.activo)
  const total     = Number(cotizacion.valorConUtilidad ?? cotizacion.valorConPorcentaje ?? 0)
  const perPax    = Number(cotizacion.valorPorPersona  ?? cotizacion.valorNetoIndividual ?? 0)

  const fmtShort  = (d: string | Date) => format(new Date(d), "dd MMM", { locale: es })
  const fmtLong   = (d: string | Date) => format(new Date(d), "dd 'de' MMMM, yyyy", { locale: es })

  const plan      = cotizacion.planPagos as { cuotas?: Array<{ numero: number; porcentaje: number; valorTotal: number; fecha?: string }> } | null
  const cuotas    = plan?.cuotas ?? null
  const mostrar   = cotizacion.mostrarPlanPagos !== false && cuotas && cuotas.length > 0
  const cobrarIva = !!cotizacion.cobrarIva
  const ivaTotal  = cobrarIva ? Math.ceil(Number(cotizacion.valorConUtilidad) * 0.19) : 0
  const finalTotal = cobrarIva ? total + ivaTotal : total
  const sumaPcts  = cuotas ? cuotas.reduce((a, c) => a + c.porcentaje, 0) : 100
  const hayColchon = sumaPcts > 100
  const totalPlan  = hayColchon ? Math.round(finalTotal * sumaPcts / 100) : finalTotal
  const colchonCOP = hayColchon ? totalPlan - finalTotal : 0

  const hasTramos = Array.isArray(cotizacion.tramos) && cotizacion.tramos.length > 0
  const paxLabel  = `${cotizacion.adultos} adulto${cotizacion.adultos !== 1 ? "s" : ""}${cotizacion.menores > 0 ? ` / ${cotizacion.menores} niño${cotizacion.menores !== 1 ? "s" : ""}` : ""}`

  const tcItems = [
    "Tarifas sujetas a disponibilidad y cambios sin previo aviso.",
    "No incluye servicios no especificados en esta cotización.",
    "En caso de cancelación, el cliente asumirá la penalidad que aplique la aerolínea.",
    "Esta agencia no se responsabiliza por variaciones tarifarias ajenas a su control.",
    "Servicios extras como maletas adicionales o visas se cotizan aparte.",
    "Los precios cotizados son válidos por 24 horas desde la fecha de emisión.",
    "El plan de pagos acordado deberá respetarse para mantener la reserva activa.",
    "En caso de no pago oportuno, la reserva podrá ser cancelada sin reembolso.",
    "ALTURA Agencia de Viajes actúa como intermediario entre el cliente y los proveedores.",
    "Cualquier reclamo por servicios de terceros se gestiona directamente con el proveedor.",
  ]

  return (
    <Document title={`Cotización ${cotizacion.codigo}`} author="Altura Agencia de Viajes">

      {/* ══ PÁGINA 1 ══ */}
      <Page size="A4" style={S.page}>
        <Watermark />
        <PageHeader url={cloudsUrl} />

        <View style={[S.content, { marginTop: 18 }]}>
          {/* Cliente */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 600, color: T.black }}>{cotizacion.cliente.nombre}</Text>
            <Text style={{ fontSize: 8, color: T.g2, marginTop: 7, lineHeight: 1.9 }}>
              {"Fecha:  "}{fmtLong(cotizacion.fechaCreacion)}
              {"\nCódigo:  "}{cotizacion.codigo}
              {cotizacion.cliente.telefono ? `\nTel:  ${cotizacion.cliente.telefono}` : ""}
              {cotizacion.cliente.correo ? `\n${cotizacion.cliente.correo}` : ""}
            </Text>
          </View>

          {/* Detalles del Viaje */}
          <Text style={S.secLabel}>Detalles del Viaje</Text>
          <View style={S.box}>
            <View style={[S.boxRow, { paddingHorizontal: 14, paddingTop: 11, paddingBottom: 9 }]}>
              {([
                { label: "Origen",    val: cotizacion.origen,  w: 82 },
                { label: "Destino",   val: cotizacion.destino, w: 90 },
                { label: "Pasajeros", val: paxLabel,           w: 108 },
                { label: "Fechas",    val: `${fmtShort(cotizacion.fechaSalida)}  —  ${fmtShort(cotizacion.fechaRegreso)}`, w: 100 },
                { label: "Duración",  val: duracion.label,     w: 0, flex: 1, aqua: true },
              ] as { label: string; val: string; w: number; flex?: number; aqua?: boolean }[]).map(({ label, val, w, flex, aqua }) => (
                <View key={label} style={{ width: w || undefined, flex: flex }}>
                  <Text style={S.detColH}>{label}</Text>
                  <View style={{ borderTopWidth: 0.4, borderTopColor: T.g3, marginTop: 5, marginBottom: 6 }} />
                  <Text style={aqua ? S.detColVAqua : S.detColV}>{val}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Servicios Incluidos */}
          {activos.length > 0 && (
            <>
              <Text style={S.secLabel}>Servicios Incluidos</Text>
              <View style={S.box}>
                <View style={S.svcGrid}>
                  {activos.map(sv => (
                    <View key={sv.id} style={S.svcItem}>
                      <Check />
                      <Text style={S.svcText}>{sv.nombre}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* Itinerario */}
          {hasTramos && (
            <>
              <Text style={S.secLabel}>Itinerario</Text>
              {(cotizacion.tramos as Tramo[]).map((t, i) => (
                <TramoBlock key={t.id} tramo={t} num={i + 1} />
              ))}
            </>
          )}

          {/* Valor y Plan de Pagos */}
          <Text style={S.secLabel}>Valor y Plan de Pagos</Text>
          <View style={S.planBox} wrap={false}>
            <View style={S.planL}>
              <View style={{ marginBottom: 12 }}>
                <Text style={S.planSm}>Valor por persona</Text>
                <Text style={[S.planBig, { fontSize: 13 }]}>{formatCOP(perPax)}</Text>
              </View>
              <View style={{ marginBottom: 12 }}>
                <Text style={S.planSm}>Total pasajeros</Text>
                <Text style={S.planMed}>{paxLabel}</Text>
              </View>
              <View>
                <Text style={S.planSm}>Valor total</Text>
                <Text style={S.planBig}>{formatCOP(finalTotal)}</Text>
              </View>
              {cobrarIva && (
                <View style={{ marginTop: 8 }}>
                  <Text style={S.planSm}>IVA (19%)</Text>
                  <Text style={[S.planMed, { fontSize: 8 }]}>+{formatCOP(ivaTotal)}</Text>
                </View>
              )}
              {hayColchon && (
                <View style={{ marginTop: 8 }}>
                  <Text style={S.planSm}>Colchón ({sumaPcts - 100}%)</Text>
                  <Text style={[S.planMed, { color: T.amber }]}>+{formatCOP(colchonCOP)}</Text>
                  <Text style={[S.planSm, { marginTop: 4 }]}>Total plan</Text>
                  <Text style={[S.planBig, { color: T.amber }]}>{formatCOP(totalPlan)}</Text>
                </View>
              )}
            </View>

            <View style={S.planDivV} />

            <View style={S.planR}>
              <View style={[S.cuotaRow, { paddingVertical: 0, marginBottom: 4 }]}>
                <Text style={[S.cuotaHH, { width: 22 }]}>Cuota</Text>
                <Text style={[S.cuotaHH, { flex: 1 }]}>Fecha</Text>
                <Text style={[S.cuotaHH, { textAlign: "right" }]}>Valor</Text>
              </View>
              <View style={S.cuotaHr} />

              {mostrar && cuotas
                ? cuotas.map((cu, i) => (
                  <View key={cu.numero}>
                    <View style={S.cuotaRow}>
                      <Text style={S.cuotaNum}>{cu.numero}</Text>
                      <Text style={S.cuotaFch}>
                        {cu.fecha ? format(new Date(cu.fecha + "T12:00:00"), "dd MMM yyyy", { locale: es }) : "—"}
                      </Text>
                      <Text style={S.cuotaVal}>{formatCOP(cu.valorTotal)}</Text>
                    </View>
                    {i < cuotas.length - 1 && <View style={S.cuotaHr} />}
                  </View>
                ))
                : <View style={S.cuotaRow}><Text style={S.cuotaFch}>Pago único</Text><Text style={S.cuotaVal}>{formatCOP(finalTotal)}</Text></View>
              }

              <View style={{ borderTopWidth: 0.4, borderTopColor: T.g3, marginTop: 8, paddingTop: 7 }}>
                <Text style={{ fontSize: 6, fontWeight: 500, color: T.g2, letterSpacing: 1.1, textTransform: "uppercase", marginBottom: 4 }}>
                  Nota importante
                </Text>
                <Text style={{ fontSize: 6.5, color: T.g1, lineHeight: 1.65, textAlign: "justify" }}>
                  {"El plan de pagos fraccionado no corresponde a un crédito bancario ni genera intereses. " +
                   "El valor final puede cambiar al momento de la emisión o del pago total según tarifas vigentes."}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Footer codigo={cotizacion.codigo} />
      </Page>

      {/* ══ PÁGINA 2 — T&C ══ */}
      <Page size="A4" style={S.page}>
        <Watermark />
        <PageHeader url={cloudsUrl} />

        <View style={[S.content, { marginTop: 18 }]}>
          <Text style={S.tcTitle}>Términos y Condiciones</Text>
          <View style={S.tcHr} />

          {tcItems.map((tc, i) => (
            <View key={i} style={S.tcItem}>
              <Check />
              <Text style={S.tcText}>{tc}</Text>
            </View>
          ))}

          {cotizacion.observaciones && (
            <View style={{ marginTop: 18 }}>
              <View style={{ borderTopWidth: 0.5, borderTopColor: T.g3, marginBottom: 8 }} />
              <Text style={S.secLabel}>Observaciones</Text>
              <Text style={{ fontSize: 8.5, color: T.g1, lineHeight: 1.7 }}>{cotizacion.observaciones}</Text>
            </View>
          )}

          <View style={{ marginTop: 28, borderTopWidth: 0.5, borderTopColor: T.g3, paddingTop: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: 600, color: T.black, marginBottom: 4 }}>
              Cristian Camilo Correa Vanegas
            </Text>
            <Text style={{ fontSize: 8.5, color: T.g1 }}>Representante Legal — ALTURA Agencia de Viajes</Text>
            <Text style={{ fontSize: 8, color: T.g2, marginTop: 3 }}>304 208 6768  ·  323 726 1564</Text>
          </View>
        </View>

        <Footer codigo={cotizacion.codigo} />
      </Page>
    </Document>
  )
}
