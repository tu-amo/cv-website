"use client";

import { parseRecipeText } from "@/lib/recipe-utils";

export default function RecipeSteps({ steps, onStepClick, onTimerClick, onTermClick }) {
    return (
        <div className="steps-list" role="list" aria-label="Recipe steps">
            {steps.map((step, idx) => (
                <div
                    key={idx}
                    className={`step-card ${step.status}`}
                    onClick={() => onStepClick(idx)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Step ${step.step_number}: ${step.status}`}
                    aria-pressed={step.status === "active"}
                >
                    <span className="step-number">{step.step_number}</span>
                    <p className="step-text">
                        {parseRecipeText(step.instruction_text).map((el, elIdx) => {
                            if (el.type === 'term') {
                                return (
                                    <span
                                        key={`term-${elIdx}`}
                                        className="highlight"
                                        style={{ borderBottomStyle: 'solid', borderBottomWidth: '2px' }}
                                        onClick={(e) => { e.stopPropagation(); onTermClick(el.data); }}
                                    >
                                        {el.content}
                                    </span>
                                );
                            } else if (el.type === 'timer') {
                                return (
                                    <span
                                        key={`timer-${elIdx}`}
                                        className="highlight"
                                        onClick={(e) => { e.stopPropagation(); onTimerClick(el.minutes); }}
                                    >
                                        {el.content}
                                    </span>
                                );
                            }
                            return el.content;
                        })}
                    </p>
                </div>
            ))}
        </div>
    );
}
