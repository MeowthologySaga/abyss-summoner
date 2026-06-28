from __future__ import annotations

import math
import random
import struct
import wave
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "audio"
SR = 22050
TAU = math.tau


def clamp(value: float, low: float = -1.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def smoothstep(value: float) -> float:
    value = clamp(value, 0.0, 1.0)
    return value * value * (3.0 - 2.0 * value)


def sine(freq: float, t: float, phase: float = 0.0) -> float:
    return math.sin(TAU * freq * t + phase)


def fade_edges(samples: list[float], seconds: float) -> None:
    fade = max(1, int(SR * seconds))
    last = len(samples) - 1
    for i in range(min(fade, len(samples))):
      gain = smoothstep(i / fade)
      samples[i] *= gain
      samples[last - i] *= gain


def normalize(samples: list[float], target: float = 0.88) -> list[float]:
    peak = max((abs(sample) for sample in samples), default=1.0)
    if peak <= 0.0001:
        return samples
    scale = min(1.0, target / peak)
    return [clamp(sample * scale) for sample in samples]


def write_wav(path: Path, samples: list[float]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    samples = normalize(samples)
    with wave.open(str(path), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SR)
        packed = b"".join(struct.pack("<h", int(clamp(sample) * 32767)) for sample in samples)
        wav.writeframes(packed)


def mix_hit(
    samples: list[float],
    start: float,
    duration: float,
    freq: float,
    amp: float,
    decay: float = 5.0,
    bend: float = 0.0,
    noise: float = 0.0,
    seed: int = 0,
) -> None:
    rng = random.Random(seed)
    start_i = max(0, int(start * SR))
    end_i = min(len(samples), int((start + duration) * SR))
    for i in range(start_i, end_i):
        t = (i - start_i) / SR
        local = t / max(duration, 0.001)
        env = math.exp(-decay * local) * smoothstep(min(1.0, t / 0.018))
        current_freq = freq * (1.0 + bend * (1.0 - local))
        tone = sine(current_freq, t)
        overtone = 0.36 * sine(current_freq * 2.01, t, 0.7)
        grit = rng.uniform(-1.0, 1.0) * noise
        samples[i] += (tone + overtone + grit) * amp * env


def mix_noise_burst(samples: list[float], start: float, duration: float, amp: float, seed: int) -> None:
    rng = random.Random(seed)
    start_i = max(0, int(start * SR))
    end_i = min(len(samples), int((start + duration) * SR))
    low = 0.0
    for i in range(start_i, end_i):
        t = (i - start_i) / SR
        local = t / max(duration, 0.001)
        low = low * 0.82 + rng.uniform(-1.0, 1.0) * 0.18
        env = math.exp(-7.5 * local) * smoothstep(min(1.0, t / 0.008))
        samples[i] += low * amp * env


def render_dungeon_loop() -> list[float]:
    duration = 48.0
    samples = [0.0] * int(duration * SR)
    rng = random.Random(1138)
    chords = [
        (36.71, 55.00, 73.42, 146.83),
        (43.65, 65.41, 87.31, 174.61),
        (49.00, 73.42, 98.00, 196.00),
        (41.20, 61.74, 82.41, 164.81),
    ]
    noise = 0.0
    for i in range(len(samples)):
        t = i / SR
        segment = int(t // 12.0) % len(chords)
        local = (t % 12.0) / 12.0
        next_segment = (segment + 1) % len(chords)
        blend = smoothstep((local - 0.82) / 0.16)
        chord = chords[segment]
        next_chord = chords[next_segment]
        pad = 0.0
        for idx, freq in enumerate(chord):
            lfo = 0.92 + 0.08 * sine(0.047 + idx * 0.012, t, idx * 0.9)
            pad += sine(freq * lfo, t, idx * 0.41) * (0.045 / (idx + 1))
            pad += sine(freq * 2.0 * lfo, t, idx * 0.63) * (0.018 / (idx + 1))
        for idx, freq in enumerate(next_chord):
            pad += sine(freq, t, idx * 0.33) * (0.035 / (idx + 1)) * blend
        drone = 0.12 * sine(27.50, t) + 0.08 * sine(36.71, t, 0.4)
        noise = noise * 0.997 + rng.uniform(-1.0, 1.0) * 0.003
        samples[i] += (drone + pad + noise * 0.09) * (0.78 + 0.08 * sine(0.031, t))

    for idx, start in enumerate([4.0, 9.0, 15.5, 21.5, 28.0, 34.5, 40.0, 45.0]):
        mix_hit(samples, start, 2.6, [220.0, 246.94, 293.66, 329.63][idx % 4], 0.13, decay=4.2, bend=0.015, seed=300 + idx)
    for idx, start in enumerate([7.5, 19.5, 31.5, 43.5]):
        mix_hit(samples, start, 1.3, 55.0, 0.22, decay=8.0, bend=0.35, noise=0.08, seed=800 + idx)
        mix_noise_burst(samples, start + 0.04, 0.42, 0.08, seed=900 + idx)
    fade_edges(samples, 0.035)
    return samples


def render_boss_loop() -> list[float]:
    duration = 32.0
    samples = [0.0] * int(duration * SR)
    rng = random.Random(905)
    noise = 0.0
    for i in range(len(samples)):
        t = i / SR
        pulse = 0.74 + 0.26 * max(0.0, sine(0.5, t))
        drone = 0.15 * sine(30.87, t) + 0.12 * sine(46.25, t, 0.5) + 0.05 * sine(65.41, t, 0.8)
        dissonance = 0.035 * sine(92.50, t, 1.1) + 0.027 * sine(138.59, t, 0.2)
        noise = noise * 0.992 + rng.uniform(-1.0, 1.0) * 0.008
        samples[i] += (drone + dissonance + noise * 0.08) * pulse

    beat = 0.75
    for idx in range(int(32 / beat)):
        start = idx * beat
        amp = 0.30 if idx % 4 == 0 else 0.20
        mix_hit(samples, start, 0.55, 46.25, amp, decay=9.5, bend=0.55, noise=0.04, seed=1200 + idx)
        if idx % 8 == 5:
            mix_noise_burst(samples, start + 0.19, 0.28, 0.17, seed=1300 + idx)
    for idx, start in enumerate([3.0, 7.0, 11.0, 15.0, 19.0, 23.0, 27.0, 31.0]):
        mix_hit(samples, start, 1.1, [196.0, 207.65, 174.61, 155.56][idx % 4], 0.15, decay=5.8, bend=0.08, noise=0.05, seed=1500 + idx)
    fade_edges(samples, 0.035)
    return samples


def render_summon_sfx(rare: bool = False) -> list[float]:
    duration = 2.1 if rare else 1.35
    samples = [0.0] * int(duration * SR)
    freqs = [246.94, 329.63, 392.0, 493.88] if rare else [220.0, 293.66, 369.99]
    for idx, freq in enumerate(freqs):
        mix_hit(samples, 0.08 + idx * 0.12, 1.0 + idx * 0.15, freq, 0.23 if rare else 0.18, decay=4.8, bend=0.025, seed=2100 + idx)
    for idx in range(10 if rare else 6):
        mix_hit(samples, 0.18 + idx * 0.13, 0.42, 880.0 + idx * 37.0, 0.055, decay=7.5, bend=0.05, seed=2200 + idx)
    mix_noise_burst(samples, 0.02, 0.32, 0.055, seed=2300)
    fade_edges(samples, 0.012)
    return samples


def render_rebirth_sfx() -> list[float]:
    samples = [0.0] * int(2.35 * SR)
    for idx, start in enumerate([0.02, 0.18, 0.34, 0.52, 0.72]):
        mix_hit(samples, start, 1.2, 82.41 + idx * 18.0, 0.13, decay=3.2, bend=0.55, seed=3100 + idx)
    mix_hit(samples, 1.15, 1.1, 41.2, 0.44, decay=6.8, bend=0.9, noise=0.06, seed=3200)
    mix_hit(samples, 1.55, 0.7, 329.63, 0.16, decay=4.6, bend=0.03, seed=3300)
    mix_noise_burst(samples, 1.08, 0.58, 0.16, seed=3400)
    fade_edges(samples, 0.012)
    return samples


def render_upgrade_sfx() -> list[float]:
    samples = [0.0] * int(0.58 * SR)
    mix_noise_burst(samples, 0.0, 0.08, 0.18, seed=4100)
    mix_hit(samples, 0.05, 0.42, 392.0, 0.18, decay=5.2, bend=0.02, seed=4200)
    mix_hit(samples, 0.14, 0.34, 523.25, 0.12, decay=5.6, bend=0.02, seed=4300)
    fade_edges(samples, 0.006)
    return samples


def render_boss_clear_sfx() -> list[float]:
    samples = [0.0] * int(1.8 * SR)
    mix_hit(samples, 0.0, 0.82, 49.0, 0.34, decay=7.2, bend=0.65, noise=0.08, seed=5100)
    mix_noise_burst(samples, 0.03, 0.45, 0.13, seed=5200)
    for idx, freq in enumerate([220.0, 293.66, 440.0]):
        mix_hit(samples, 0.45 + idx * 0.16, 0.9, freq, 0.13, decay=4.4, bend=0.015, seed=5300 + idx)
    fade_edges(samples, 0.012)
    return samples


def render_attack_cast_sfx() -> list[float]:
    samples = [0.0] * int(0.34 * SR)
    mix_hit(samples, 0.0, 0.25, 440.0, 0.11, decay=5.8, bend=0.16, seed=6100)
    mix_hit(samples, 0.05, 0.28, 659.25, 0.08, decay=6.6, bend=0.06, seed=6101)
    mix_noise_burst(samples, 0.02, 0.18, 0.035, seed=6102)
    fade_edges(samples, 0.006)
    return samples


def render_attack_swing_sfx() -> list[float]:
    samples = [0.0] * int(0.24 * SR)
    mix_noise_burst(samples, 0.0, 0.13, 0.105, seed=6200)
    mix_hit(samples, 0.03, 0.18, 196.0, 0.08, decay=7.0, bend=0.45, noise=0.035, seed=6201)
    fade_edges(samples, 0.005)
    return samples


def render_attack_arrow_sfx() -> list[float]:
    samples = [0.0] * int(0.20 * SR)
    mix_noise_burst(samples, 0.0, 0.08, 0.08, seed=6300)
    mix_hit(samples, 0.015, 0.16, 740.0, 0.065, decay=8.2, bend=0.18, seed=6301)
    fade_edges(samples, 0.005)
    return samples


def render_attack_curse_sfx() -> list[float]:
    samples = [0.0] * int(0.38 * SR)
    mix_hit(samples, 0.0, 0.34, 185.0, 0.09, decay=4.8, bend=-0.12, noise=0.045, seed=6400)
    mix_hit(samples, 0.04, 0.28, 277.18, 0.07, decay=5.6, bend=0.04, seed=6401)
    fade_edges(samples, 0.007)
    return samples


def render_hit_light_sfx() -> list[float]:
    samples = [0.0] * int(0.22 * SR)
    mix_noise_burst(samples, 0.0, 0.08, 0.15, seed=6500)
    mix_hit(samples, 0.012, 0.18, 130.81, 0.12, decay=8.8, bend=0.45, noise=0.045, seed=6501)
    fade_edges(samples, 0.005)
    return samples


def render_hit_heavy_sfx() -> list[float]:
    samples = [0.0] * int(0.42 * SR)
    mix_noise_burst(samples, 0.0, 0.22, 0.19, seed=6600)
    mix_hit(samples, 0.02, 0.36, 61.74, 0.28, decay=8.0, bend=0.6, noise=0.065, seed=6601)
    mix_hit(samples, 0.11, 0.22, 123.47, 0.09, decay=7.4, bend=0.24, seed=6602)
    fade_edges(samples, 0.006)
    return samples


def render_critical_hit_sfx() -> list[float]:
    samples = [0.0] * int(0.34 * SR)
    mix_noise_burst(samples, 0.0, 0.10, 0.13, seed=6650)
    mix_hit(samples, 0.006, 0.23, 1760.0, 0.13, decay=9.6, bend=0.08, noise=0.025, seed=6651)
    mix_hit(samples, 0.026, 0.25, 880.0, 0.11, decay=8.4, bend=-0.18, seed=6652)
    mix_hit(samples, 0.052, 0.21, 220.0, 0.12, decay=8.8, bend=0.34, noise=0.04, seed=6653)
    fade_edges(samples, 0.005)
    return samples


def render_enemy_down_sfx() -> list[float]:
    samples = [0.0] * int(0.68 * SR)
    mix_noise_burst(samples, 0.0, 0.28, 0.11, seed=6700)
    mix_hit(samples, 0.02, 0.58, 98.0, 0.16, decay=5.8, bend=-0.24, noise=0.04, seed=6701)
    mix_hit(samples, 0.19, 0.38, 73.42, 0.12, decay=6.8, bend=-0.16, seed=6702)
    fade_edges(samples, 0.008)
    return samples


def main() -> None:
    write_wav(OUT / "abyss-dungeon-loop.wav", render_dungeon_loop())
    write_wav(OUT / "abyss-boss-loop.wav", render_boss_loop())
    write_wav(OUT / "summon-rite.wav", render_summon_sfx(False))
    write_wav(OUT / "summon-rare.wav", render_summon_sfx(True))
    write_wav(OUT / "rebirth.wav", render_rebirth_sfx())
    write_wav(OUT / "upgrade.wav", render_upgrade_sfx())
    write_wav(OUT / "boss-clear.wav", render_boss_clear_sfx())
    write_wav(OUT / "attack-cast.wav", render_attack_cast_sfx())
    write_wav(OUT / "attack-swing.wav", render_attack_swing_sfx())
    write_wav(OUT / "attack-arrow.wav", render_attack_arrow_sfx())
    write_wav(OUT / "attack-curse.wav", render_attack_curse_sfx())
    write_wav(OUT / "hit-light.wav", render_hit_light_sfx())
    write_wav(OUT / "hit-heavy.wav", render_hit_heavy_sfx())
    write_wav(OUT / "critical-hit.wav", render_critical_hit_sfx())
    write_wav(OUT / "enemy-down.wav", render_enemy_down_sfx())
    print(f"Generated audio in {OUT}")


if __name__ == "__main__":
    main()
