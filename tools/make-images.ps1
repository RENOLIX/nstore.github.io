# Génère les visuels du site (versions PC et téléphone) à partir des photos produits.
# Usage : powershell -File tools\make-images.ps1 -Src <dossier des photos 1.jpg ... 8.jpg>
param([Parameter(Mandatory = $true)][string]$Src)

$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root 'public\img'
New-Item -ItemType Directory -Force $out | Out-Null

Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class Canvas : IDisposable {
  Bitmap bmp; Graphics g; public int W, H;

  static void Hq(Graphics g) {
    g.InterpolationMode = InterpolationMode.HighQualityBicubic;
    g.PixelOffsetMode = PixelOffsetMode.HighQuality;
    g.SmoothingMode = SmoothingMode.HighQuality;
    g.CompositingQuality = CompositingQuality.HighQuality;
  }
  static void SaveJpg(Bitmap b, string path, long q) {
    ImageCodecInfo enc = null;
    foreach (var e in ImageCodecInfo.GetImageEncoders()) if (e.MimeType == "image/jpeg") enc = e;
    var p = new EncoderParameters(1);
    p.Param[0] = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, q);
    b.Save(path, enc, p);
  }
  public static string Resize(string src, string dst, int w) {
    using (var s = new Bitmap(src)) {
      if (w > s.Width) w = s.Width;
      int h = (int)Math.Round(s.Height * (double)w / s.Width);
      using (var b = new Bitmap(w, h, PixelFormat.Format24bppRgb))
      using (var g = Graphics.FromImage(b)) { Hq(g); g.DrawImage(s, new Rectangle(0, 0, w, h)); SaveJpg(b, dst, 86); }
      return s.Width + "x" + s.Height + " -> " + w + "x" + h;
    }
  }
  static Color Border(Bitmap s) {
    long r = 0, gg = 0, b = 0, n = 0; int m = Math.Max(2, s.Width / 40);
    for (int y = 0; y < s.Height * 3 / 4; y += 3) for (int x = 0; x < s.Width; x += 3)
      if (x < m || x >= s.Width - m || y < m) { var p = s.GetPixel(x, y); r += p.R; gg += p.G; b += p.B; n++; }
    return Color.FromArgb((int)(r / n), (int)(gg / n), (int)(b / n));
  }
  public Canvas(int w, int h, string bgSrc) {
    W = w; H = h; bmp = new Bitmap(w, h, PixelFormat.Format24bppRgb); g = Graphics.FromImage(bmp); Hq(g);
    using (var s = new Bitmap(bgSrc)) g.Clear(Border(s));
  }
  static double Smooth(double t) { if (t <= 0) return 0; if (t >= 1) return 1; return t * t * (3 - 2 * t); }

  // Pose une photo : cx = centre horizontal (0..1), y = haut en pixels, h = hauteur ; fl/fr/ft/fb = fondus des bords
  public void Place(string src, double cx, int y, int h, int fl, int fr, int ft, int fb) {
    using (var s = new Bitmap(src)) {
      int w = (int)Math.Round(s.Width * (double)h / s.Height);
      int x = (int)Math.Round(cx * W - w / 2.0);
      using (var layer = new Bitmap(w, h, PixelFormat.Format32bppArgb)) {
        using (var lg = Graphics.FromImage(layer)) { Hq(lg); lg.DrawImage(s, new Rectangle(0, 0, w, h)); }
        var data = layer.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        var buf = new byte[data.Stride * h];
        Marshal.Copy(data.Scan0, buf, 0, buf.Length);
        for (int py = 0; py < h; py++) for (int px = 0; px < w; px++) {
          double a = 1;
          if (fl > 0) a = Math.Min(a, Smooth(px / (double)fl));
          if (fr > 0) a = Math.Min(a, Smooth((w - 1 - px) / (double)fr));
          if (ft > 0) a = Math.Min(a, Smooth(py / (double)ft));
          if (fb > 0) a = Math.Min(a, Smooth((h - 1 - py) / (double)fb));
          buf[py * data.Stride + px * 4 + 3] = (byte)(255 * a);
        }
        Marshal.Copy(buf, 0, data.Scan0, buf.Length);
        layer.UnlockBits(data);
        g.DrawImage(layer, x, y, w, h);
      }
    }
  }
  public void Save(string dst) { SaveJpg(bmp, dst, 88); }
  public void Dispose() { g.Dispose(); bmp.Dispose(); }
}
'@

function P($n) { Join-Path $Src "$n.jpg" }
function O($name) { Join-Path $out $name }

# 1. Photos produits : une version PC, une version téléphone
1..8 | ForEach-Object {
  $a = [Canvas]::Resize((P $_), (O "p$_-desktop.jpg"), 1200)
  $b = [Canvas]::Resize((P $_), (O "p$_-mobile.jpg"), 640)
  "p$_ : $a | $b"
}

"OK -> $out"
