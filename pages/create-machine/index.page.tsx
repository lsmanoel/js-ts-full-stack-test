import React, { useEffect } from "react";
import { useRouter } from "next/router";

import FormControl from "@mui/material/FormControl";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";

import Machine from "lib/utils/types/machine";

import { useAppSelector } from "redux/hooks";
import { Session } from "lib/auth/auth";
import { machinePostResultMsg as postResultMsg } from "lib/utils/post/post-result";

export async function post(
  machine: Machine,
  session: Session | null
): Promise<string> {
  if (!session) {
    return postResultMsg.BAD_CREDENTIALS;
  }

  const createRoute = "/api/machine/create";
  const response = await fetch(createRoute, {
    body: JSON.stringify({
      name: machine.name,
      type: machine.type,
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + session.token,
    },
    method: "POST",
  }).catch(() => null);

  if (!response) {
    return postResultMsg.FETCH_ERROR;
  } else if (response.status === 409) {
    return postResultMsg.DATA_CONFLICT;
  } else if (response.status === 401) {
    return postResultMsg.BAD_CREDENTIALS;
  } else if (response.status !== 200) {
    return postResultMsg.UNKNOW_ERROR;
  }

  const postResponse = await response.json().catch(() => null);

  if (postResponse.name != machine.name || postResponse.type != machine.type) {
    return postResultMsg.BAD_RESPONSE;
  } else {
    return postResultMsg.SUCCESS;
  }
}

export default function CreateMachine() {
  const session = useAppSelector((state) => state.sessionReducer.session);
  const router = useRouter();

  const [error, setError] = React.useState<string | null>(null);
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [typeError, setTypeError] = React.useState<string | null>(null);
  const [conflictError, setConflictError] = React.useState<string | null>(null);
  const [type, setType] = React.useState("Pump");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session) {
      router.push("/login");
      return;
    }

    const data = new FormData(event.currentTarget);

    const name = data.get("name")?.toString();

    if (!name) setNameError("faltou inserir o nome da máquina");
    if (!type) setTypeError("faltou selecionar o tipo da máquina");

    if (!name || !type) return;

    const responseStatus = await post(
      { id: null, name: name || "", type: type || "" },
      session
    );

    if (responseStatus == postResultMsg.DATA_CONFLICT)
      setConflictError(postResultMsg.DATA_CONFLICT);

    if (responseStatus == postResultMsg.SUCCESS) router.push("/");
  };

  useEffect(() => {
    if (nameError || typeError) setError("preencha o formulário corretamente");
    else if (conflictError) setError(conflictError);
    else setError(null);
  });

  const handleSetType = (e: SelectChangeEvent) => {
    e.preventDefault();
    setType(e.target.value);
  };

  return (
    <Box
      sx={{
        marginTop: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        paddingX: "30%",
      }}
    >
      <Paper
        sx={{
          p: 2,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5">
          Criar Máquina
        </Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Nome da Máquina"
            name="name"
            autoFocus
            error={!!nameError}
            helperText={nameError}
            onChange={() => {
              setNameError(null);
              setConflictError(null);
            }}
            inputProps={{ "data-testid": "name-input" }}
          />
          <FormControl sx={{ marginTop: 1, width: "100%" }}>
            <InputLabel id="type-label">Tipo</InputLabel>
            <Select
              value={type}
              fullWidth
              labelId="type-label"
              id="type"
              label="Tipo"
              onChange={handleSetType}
              data-testid="type-input"
            >
              <MenuItem value={"Pump"}>Pump</MenuItem>
              <MenuItem value={"Fan"}>Fan</MenuItem>
            </Select>
          </FormControl>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            color={!!error ? "error" : "primary"}
            disabled={!!error}
            data-testid="submit-button"
          >
            Criar Máquina
          </Button>
          {error && (
            <Alert severity="error" data-testid="alert-error">
              {error}
            </Alert>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
