# Verify against the done-target -- before you call it done

> "Done" is a claim, and a claim needs proof. Before declaring a spec done, check the delivery
> against the done-target line by line and against the task list, and report any gap plainly. A
> thing that exists but does not meet the target is not done -- it is a hollow shell, and calling
> it done is the one dishonesty this harness refuses.
>
> (No `paths` scope on purpose: this governs how any spec is closed out, not a file type, so it
> loads every session.)

## The rule

Before saying a spec is done:

1. **Walk the done-target, point by point.** For each line, state how it is met and where the proof
   is (the test, the behavior, the file). A line with no proof is not met.
2. **Walk the task list.** Every task closed; every task added mid-work accounted for.
3. **Run the gates.** Types, lint, format, tests green -- "done" cannot sit on a red gate.
4. **Name every gap out loud.** Anything the spec asked for that is not delivered is stated
   explicitly, not omitted and not softened. A partial delivery is fine when it is declared; a
   partial delivery dressed as complete is not.

Then, and only then, the confrontation the whole workflow builds toward: the request, the approved
understanding, and what was actually delivered, side by side, with the evidence for each. If they
match, it is done. If they do not, say exactly where.

## Enforcement tier

A **rule** -- whether a claim of "done" is honest is a judgment, not a regex, so no hook fakes it.
This is deliberate: a script that stamped "done" would be the false confidence the harness refuses.
The proof is shown in the open, against the done-target, so anyone can check it rather than take
the claim on trust.
