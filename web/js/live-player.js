'use strict';

(() => {
  const { W, DT, FLOOR_PAD, WARNING_Y, crew, clamp } = Jelly;
  const random = (min, max) => min + (max - min) * Math.random();

  function contact(world, slot, rackY, angle, power, speed) {
    const radius = slot.wild ? 27 : crew[slot.level].r;
    const dx = Math.sin(angle), dy = Math.cos(angle);
    let x = slot.x + dx * power * 42;
    let y = rackY + dy * power * 42;
    let vx = dx * speed, vy = dy * speed;
    const left = 4 + radius, right = W - left;
    const floor = world.height - FLOOR_PAD - radius * .9;

    // Sample the release path against the current pile. The soft-body engine resolves the actual collision.
    for (let step = 0; step < 240; step++) {
      vx *= .993;
      vy = vy * .993 + world.gy * DT;
      x += vx * DT;
      y += vy * DT;
      if (x < left || x > right) { x = clamp(x, left, right); vx *= -.42; }
      if (step % 3 !== 0 && y < floor) continue;
      for (const body of world.bodies) {
        const reachX = (body.right - body.left) * .5 + radius * .98;
        const reachY = (body.bottom - body.top) * .5 + radius * .83;
        if (Math.abs(x - body.x) > reachX || Math.abs(y - body.y) > reachY) continue;
        if (((x - body.x) / reachX) ** 2 + ((y - body.y) / reachY) ** 2 <= 1) return { body, x, y };
      }
      if (y >= floor) break;
    }
    return { body: null, x, y };
  }

  function chooseShot(world, slots, rackY, available, speedFor, previousSlot) {
    const choices = [];
    const preferTap = Math.random() < .28;
    for (const index of available) {
      const slot = slots[index];
      for (const aim of [null, 0, -.18, .18, -.38, .38, -.62, .62, -.84, .84]) {
        const drop = aim === null;
        const angle = drop ? 0 : aim + random(-.055, .055);
        const power = drop ? 0 : random(.19, .52);
        const hit = contact(world, slot, rackY, angle, power, speedFor(drop, power));
        const body = hit.body;
        const matches = body && !body.wild && body.level < crew.length - 1
          && (slot.wild || (!body.frozen && body.level === slot.level));
        const nearbyMatch = world.bodies.some(b => !b.wild && b.level === slot.level
          && b !== body && Math.hypot(b.x - hit.x, b.y - hit.y) < b.r + 67);
        const heightRisk = Math.max(0, WARNING_Y + (matches ? 53 : 112) - hit.y);
        const score = (matches ? 82 + body.level * 2 : nearbyMatch ? 18 : 0)
          + hit.y / world.height * 37 - heightRisk * .7
          - Math.abs(angle) * 5 + (drop === preferTap ? 8 : 0) + (index === previousSlot ? -2 : 0)
          + random(-12, 12);
        choices.push({ slot: index, angle, power, drop, score, matches: !!matches, heightRisk });
      }
    }
    choices.sort((a, b) => b.score - a.score);
    const best = choices[0];
    if (!best) return null;
    if (preferTap) {
      const tap = choices.find(shot => shot.drop && shot.heightRisk === 0);
      if (tap && (tap.score >= best.score - 34 || Math.random() < .55)) return tap;
    }
    // Occasionally take another reasonable shot, with a little imprecision in the pull.
    const alternatives = choices.filter(shot => shot.score >= best.score - 28).slice(0, 6);
    return Math.random() < .24 ? alternatives[Math.floor(Math.random() * alternatives.length)] : best;
  }

  function aimPath(shot) {
    const points = [{ angle: 0, power: 0, at: 0 }];
    const add = (angle, power, seconds) => points.push({ angle, power, at: points.at(-1).at + seconds });
    const pattern = Math.random();
    if (pattern < .67) {
      const side = Math.random() < .5 ? -1 : 1;
      const firstAngle = Math.random() < .4 ? random(-.12, .12) : clamp(shot.angle + side * random(.28, .66), -1.16, 1.16);
      const firstPower = shot.power * random(.40, .84);
      add(firstAngle, firstPower, random(.12, .35));
      if (pattern < .22) {
        if (Math.random() < .65) add(firstAngle, firstPower, random(.06, .24));
        add(clamp(shot.angle - side * random(.14, .37), -1.16, 1.16), shot.power * random(.72, 1.18), random(.08, .24));
      }
      add(shot.angle, shot.power, random(.10, .29));
    } else {
      add(shot.angle, shot.power, random(.11, .42));
    }
    if (Math.random() < .31) add(shot.angle, shot.power, random(.05, .22));
    return points;
  }

  function nextDelay() {
    const pace = Math.random();
    if (pace < .26) return random(.22, .53);
    if (pace < .83) return random(.55, 1.17);
    return random(1.24, 2.48);
  }

  Jelly.livePlayer = { chooseShot, aimPath, nextDelay };
})();
