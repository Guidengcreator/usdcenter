import { useEffect, useState } from "react";

import {
  getClinicInformation,
  type ClinicInformation,
} from "../../api/clinic-information.js";

export type ClinicInformationState =
  | { status: "loading" }
  | { status: "ready"; data: ClinicInformation }
  | { status: "error" };

export function useClinicInformation(): ClinicInformationState {
  const [state, setState] = useState<ClinicInformationState>({
    status: "loading",
  });

  useEffect(() => {
    const abortController = new AbortController();

    void getClinicInformation(abortController.signal)
      .then((data) => {
        setState({ status: "ready", data });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setState({ status: "error" });
      });

    return () => {
      abortController.abort();
    };
  }, []);

  return state;
}
