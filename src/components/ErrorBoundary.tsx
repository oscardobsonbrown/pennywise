import { Component, type ReactNode } from "react";
import { Dialog } from "./Dialog";
import { Button } from "./Button";

const GITHUB_ISSUES_URL = "https://github.com/brianlovin/tax-ui/issues/new";

interface ErrorInfo {
    componentStack?: string;
}

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    name?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

function createIssueUrl(
    error: Error | null,
    errorInfo: ErrorInfo | null,
    name?: string,
): string {
    const title = encodeURIComponent(
        `[Bug] ${error?.name || "Error"}: ${error?.message?.slice(0, 80) || "Unknown error"}`,
    );

    const body = encodeURIComponent(
        `## Description
Encountered an unexpected error${name ? ` in ${name}` : ""}.

## Error Details
\`\`\`
${error?.name}: ${error?.message}
\`\`\`

## Stack Trace
\`\`\`
${error?.stack || "No stack trace available"}
\`\`\`

## Component Stack
\`\`\`
${errorInfo?.componentStack || "No component stack available"}
\`\`\`

## Environment
- URL: ${typeof window !== "undefined" ? window.location.href : "N/A"}
- User Agent: ${typeof navigator !== "undefined" ? navigator.userAgent : "N/A"}
- Timestamp: ${new Date().toISOString()}

## Steps to Reproduce
1. [Please describe what you were doing when the error occurred]
`,
    );

    return `${GITHUB_ISSUES_URL}?title=${title}&body=${body}`;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo });
        console.error(
            `ErrorBoundary${this.props.name ? ` (${this.props.name})` : ""} caught:`,
            error,
            errorInfo,
        );
    }

    handleDismiss = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    handleReload = () => {
        window.location.reload();
    };

    override render() {
        const { hasError, error, errorInfo } = this.state;
        const { children, fallback, name } = this.props;

        if (hasError) {
            if (fallback) {
                return fallback;
            }

            const issueUrl = createIssueUrl(error, errorInfo, name);

            return (
                <Dialog
                    open={true}
                    onClose={this.handleDismiss}
                    title="Something went wrong"
                    description={`An unexpected error occurred${name ? ` in ${name}` : ""}. If this keeps happening, please open an issue on GitHub so we can fix it.`}
                    size="lg"
                >
                    <div className="bg-(--color-bg-muted) border border-(--color-border) rounded-lg p-3 mb-4 max-h-32 overflow-auto">
                        <code className="text-xs text-red-500 font-mono whitespace-pre-wrap break-all">
                            {error?.name}: {error?.message}
                        </code>
                    </div>

                    <div className="flex gap-3 justify-end">
                        <Button variant="secondary" onClick={this.handleReload}>
                            Reload page
                        </Button>
                        <a
                            href={issueUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button variant="primary">Open issue</Button>
                        </a>
                    </div>
                </Dialog>
            );
        }

        return children;
    }
}
